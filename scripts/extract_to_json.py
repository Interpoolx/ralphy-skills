import requests
import json
import os
import time

BASE_URL = "https://claude-plugins.dev/api/plugins"
OUTPUT_FILE = "claude-plugins.json"

def fetch_skills(limit=100, offset=0):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://claude-plugins.dev/",
        "Origin": "https://claude-plugins.dev",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin"
    }
    
    params = {
        "q": "",
        "limit": limit,
        "offset": offset
    }
    
    try:
        response = requests.get(BASE_URL, headers=headers, params=params, timeout=30)
        if response.status_code == 403:
            print(f"Received 403 Forbidden at offset {offset}. Protection detected.")
            return None
            
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error at offset {offset}: {e}")
        return None

def main():
    all_plugins = []
    offset = 0
    limit = 100
    
    print("Starting full extraction of Claude Plugins...")
    
    while True:
        data = fetch_skills(limit=limit, offset=offset)
        
        if not data or "plugins" not in data:
            print("Finished or encountered an error.")
            break
            
        plugins = data["plugins"]
        if not plugins:
            print("No more plugins found.")
            break
            
        all_plugins.extend(plugins)
        print(f"Fetched {len(plugins)} items (Total: {len(all_plugins)}). Moving to next batch...")
        
        offset += limit
        # Be polite to the server
        time.sleep(0.5)
        
        # Optional: Safety break if we want to limit testing
        # if offset >= 500: break

    if all_plugins:
        with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
            json.dump(all_plugins, f, indent=2)
        print(f"Successfully saved {len(all_plugins)} items to {OUTPUT_FILE}")
    else:
        print("No data extracted.")

if __name__ == "__main__":
    main()
