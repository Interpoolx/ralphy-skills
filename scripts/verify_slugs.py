import json
from collections import Counter

FILE = 'claude-plugins-clean.json'

def verify():
    print(f"Checking {FILE}...")
    try:
        with open(FILE, 'r', encoding='utf-8') as f:
            skills = json.load(f)
            
        print(f"Total skills: {len(skills)}")
        
        # Check code-review specifically
        code_reviews = [s for s in skills if 'code-review' in s['id']]
        print(f"Skills with 'code-review' in ID: {len(code_reviews)}")
        for s in code_reviews[:10]:
            print(f" - {s['id']} (Name: {s['name']})")
            
        # Check overall uniqueness
        ids = [s['id'] for s in skills]
        counts = Counter(ids)
        duplicates = [id for id, count in counts.items() if count > 1]
        
        if duplicates:
            print(f"ERROR: Found {len(duplicates)} duplicate IDs!")
            print(duplicates[:10])
        else:
            print("SUCCESS: All IDs are unique.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify()
