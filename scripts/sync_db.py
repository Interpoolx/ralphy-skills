import argparse
import requests
import sys
import os
import time

# Default configuration
DEFAULT_LOCAL_API = "http://localhost:8787"

def get_token(token_arg):
    """Get admin token."""
    return token_arg or os.environ.get("RALPHY_ADMIN_TOKEN") or "ralphy-default-admin-token"

def fetch_all_data(api_url, token):
    """Fetch all skills from the source API."""
    export_url = f"{api_url.rstrip('/')}/api/admin/export"
    print(f"📥 Fetching data from {export_url}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(export_url, headers=headers, timeout=60)
        response.raise_for_status()
        data = response.json()
        if not isinstance(data, list):
            raise ValueError(f"Expected list of skills, got {type(data)}")
        print(f"✅ Successfully fetched {len(data)} skills.")
        return data
    except Exception as e:
        print(f"❌ Error fetching from {api_url}: {e}")
        sys.exit(1)

def push_in_chunks(api_url, token, skills, chunk_size=500):
    """Push skills to the target API in chunks."""
    import_url = f"{api_url.rstrip('/')}/api/admin/import"
    print(f"📤 Pushing to {import_url}...")

    total_skills = len(skills)
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    total_imported = 0
    total_errors = 0

    for i in range(0, total_skills, chunk_size):
        chunk = skills[i : i + chunk_size]
        print(f"   🚀 Sending chunk {i//chunk_size + 1}/{total_skills//chunk_size + 1} ({len(chunk)} skills)...")
        
        payload = {
            "skills": chunk,
            "import_source": "db_sync",
            "platform": "global"
        }

        try:
            response = requests.post(import_url, json=payload, headers=headers, timeout=120)
            response.raise_for_status()
            result = response.json()
            total_imported += result.get('imported', 0)
            total_errors += result.get('errors', 0)
        except Exception as e:
            print(f"   ⚠️ Failed to push chunk: {e}")
            total_errors += len(chunk)
            
        # Rate limit prevention
        time.sleep(0.2)

    print(f"\n✨ Sync Complete: {total_imported} transferred, {total_errors} errors.")

def main():
    parser = argparse.ArgumentParser(description="Sync Ralphy Skills Database (DB-to-DB)")
    parser.add_argument("direction", choices=["push", "pull"], help="Direction of sync (push: Local->Remote, pull: Remote->Local)")
    parser.add_argument("--remote-url", required=True, help="Remote API URL (e.g. https://api.worker.dev)")
    parser.add_argument("--local-url", default=DEFAULT_LOCAL_API, help="Local API URL")
    parser.add_argument("--token", help="Admin Token (used for both if same, or remote)")
    
    args = parser.parse_args()
    token = get_token(args.token)

    if args.direction == "push":
        # Local -> Remote
        print(f"🔄 SYNC: LOCAL ({args.local_url}) ===> REMOTE ({args.remote_url})")
        data = fetch_all_data(args.local_url, token)
        if data:
            push_in_chunks(args.remote_url, token, data)
            
    elif args.direction == "pull":
        # Remote -> Local
        print(f"🔄 SYNC: REMOTE ({args.remote_url}) ===> LOCAL ({args.local_url})")
        data = fetch_all_data(args.remote_url, token)
        if data:
            push_in_chunks(args.local_url, token, data)

if __name__ == "__main__":
    main()
