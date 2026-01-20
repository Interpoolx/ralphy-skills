import requests
import json
import os
import time

IMPORT_API = "http://localhost:8787/api/admin/import"
ADMIN_TOKEN = os.environ.get("RALPHY_ADMIN_TOKEN", "ralphy-default-admin-token")

def import_chunk(skills, source_name, platform="global"):
    payload = {
        "skills": skills,
        "import_source": source_name,
        "platform": platform
    }
    headers = {
        "Authorization": f"Bearer {ADMIN_TOKEN}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(IMPORT_API, json=payload, headers=headers, timeout=120)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error importing chunk: {e}")
        CLAUDE_PLUGINS_FILE = "claude-plugins.json"

def load_skills_from_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
        # Handle list or dict format
        if isinstance(data, list):
            return data
        return data.get('skills', [])

def import_file_chunked(file_path, source_name, platform="global", chunk_size=500):
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    skills = load_skills_from_file(file_path)
    total_skills = len(skills)
    print(f"Loaded {total_skills} skills from {file_path}. Importing in chunks of {chunk_size}...")

    total_imported = 0
    total_errors = 0

    for i in range(0, total_skills, chunk_size):
        chunk = skills[i : i + chunk_size]
        print(f"Importing chunk {i//chunk_size + 1} ({i} to {min(i+chunk_size, total_skills)})...")
        
        res = import_chunk(chunk, source_name, platform)
        if res:
            total_imported += res.get('imported', 0)
            total_errors += res.get('errors', 0)
        else:
            total_errors += len(chunk)
        
        # Polite delay
        time.sleep(0.5)

    print(f"Import Result for {source_name}: {total_imported} imported, {total_errors} errors.")

def main():
    # 1. Import marketplace skills (smaller, can do in one chunk)
    import_file_chunked("web/public/marketplace.json", "marketplace", "global", chunk_size=500)
    
    # 2. Import all Claude plugins (chunked)
    import_file_chunked("claude-plugins.json", "claude-plugins", "claude", chunk_size=500)

if __name__ == "__main__":
    main()
