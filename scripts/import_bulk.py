import requests
import time
import json

BASE_URL = "https://claude-plugins.dev/api/plugins"
IMPORT_API = "http://localhost:8787/api/admin/import"
BATCH_SIZE = 100
MAX_PLUGINS = 12500 # Slightly more than 12159 reported

def fetch_batch(offset, limit=100):
    url = f"{BASE_URL}?q=&limit={limit}&offset={offset}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching batch at offset {offset}: {e}")
        return None

def import_skills(skills):
    if not skills:
        return 0, 0
    
    payload = {
        "skills": skills,
        "import_source": "https://claude-plugins.dev/api/plugins",
        "platform": "claude"
    }
    
    try:
        response = requests.post(IMPORT_API, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        return data.get("imported", 0), data.get("errors", 0)
    except Exception as e:
        print(f"Error importing batch: {e}")
        return 0, len(skills)

def main():
    total_imported = 0
    total_errors = 0
    offset = 0
    
    print(f"Starting bulk import from {BASE_URL}...")
    
    while offset < MAX_PLUGINS:
        print(f"Fetching batch: offset={offset}, limit={BATCH_SIZE}...")
        data = fetch_batch(offset, BATCH_SIZE)
        
        if not data or not data.get("plugins"):
            print("No more data or error fetching. Stopping.")
            break
        
        plugins = data["plugins"]
        batch_count = len(plugins)
        
        print(f"Found {batch_count} skills. Importing to local API...")
        imported, errors = import_skills(plugins)
        
        total_imported += imported
        total_errors += errors
        
        print(f"Batch Result: {imported} imported, {errors} errors. Total: {total_imported}/{total_errors}")
        
        offset += batch_count
        
        # Small delay to be polite
        time.sleep(1)
        
        if batch_count < BATCH_SIZE:
            print("Reached last page.")
            break

    print("\n--- Final Report ---")
    print(f"Total Imported: {total_imported}")
    print(f"Total Errors: {total_errors}")
    print("Bulk import complete!")

if __name__ == "__main__":
    main()
