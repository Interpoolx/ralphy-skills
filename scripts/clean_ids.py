import json
import re
import os
from collections import Counter

INPUT_FILE = 'claude-plugins.json'
OUTPUT_FILE = 'claude-plugins-clean.json'

def make_slug(name):
    slug = name.lower().strip()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return slug or 'unknown'

def clean_ids():
    if not os.path.exists(INPUT_FILE):
        print(f"Error: {INPUT_FILE} not found.")
        return

    print(f"Reading {INPUT_FILE}...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Handle if it's a list or a dict with 'skills'
    skills = data if isinstance(data, list) else data.get('skills', [])
    
    print(f"Processing {len(skills)} skills...")
    
    slug_counts = Counter()
    processed_skills = []
    
    # First pass: count frequencies to know valid duplicates vs unique
    # Actually simpler: just generate and check existing set
    seen_slugs = set()
    
    for skill in skills:
        name = skill.get('name', 'Unknown Skill')
        base_slug = make_slug(name)
        
        slug = base_slug
        counter = 1
        
        # Ensure uniqueness
        while slug in seen_slugs:
            counter += 1
            slug = f"{base_slug}-{counter}"
            
        seen_slugs.add(slug)
        
        # Update ID
        old_id = skill.get('id')
        skill['id'] = slug
        if old_id and old_id != slug:
            skill['_legacy_id'] = old_id
            
        processed_skills.append(skill)

    # Save
    print(f"Saving {len(processed_skills)} cleaned skills to {OUTPUT_FILE}...")
    output_data = processed_skills if isinstance(data, list) else {**data, 'skills': processed_skills}
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
        
    print("Done. Duplicate check:")
    print(f"Unique slugs generated: {len(seen_slugs)}")

if __name__ == "__main__":
    clean_ids()
