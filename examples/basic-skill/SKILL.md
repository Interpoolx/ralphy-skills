---
name: basic-skill
description: Minimal example skill showing Anthropic SKILL.md format
version: 1.0.0
keywords: [example, getting-started, tutorial]
author:
  name: Ralphy Team
  github: Interpoolx
category: utilities
compatible_agents: [claude-code, cursor, windsurf, aider]
---

# Basic Skill Example

This is a minimal example skill demonstrating the Anthropic SKILL.md format. Use this as a starting point when creating your own skills.

## Purpose

This skill shows the essential structure needed for any Ralphy skill:
- YAML frontmatter for metadata
- Clear instructions in markdown
- Step-by-step guidance

## When to Use This Skill

Load this skill when:
- Learning how to create skills
- Testing the Ralphy-Skills loader
- Building your first skill
- Understanding the SKILL.md format

## Quick Start

To create your own skill based on this:

1. **Clone the example**:
   ```bash
   npx ralphy-skills create my-skill --template basic
   ```

2. **Edit the metadata**:
   - Change `name` to your skill ID (kebab-case)
   - Update `description` to one line
   - Add relevant `keywords` for discovery

3. **Write your instructions**:
   - Use imperative form: "To do X, follow..."
   - Avoid second person: don't say "You should..."
   - Keep it clear and actionable

4. **Test your skill**:
   ```bash
   npx ralphy-skills validate ./my-skill
   ```

## File Structure

Your skill should have:

```
my-skill/
├── SKILL.md              # This file (required)
└── marketplace.json      # Metadata (required)
```

Optional additions:

```
my-skill/
├── references/
│   └── detailed-guide.md
├── scripts/
│   └── setup.sh
└── assets/
    └── templates/
```

## Best Practices

### Do's
✅ Use clear, imperative language  
✅ Start with a purpose section  
✅ Include quick start instructions  
✅ Add examples and use cases  
✅ Keep it focused and concise  
✅ Document any dependencies  

### Don'ts
❌ Use second person ("you should")  
❌ Assume user knowledge  
❌ Make it too long (keep under 5,000 words)  
❌ Skip important details  
❌ Use unclear jargon without explanation  

## Resources

For more information:
- See `references/` directory for extended docs
- Check `scripts/` for executable examples
- View `assets/` for templates and configs

## Troubleshooting

**Q: How do I add images?**  
A: Store images in `assets/` and reference as:
```markdown
![alt text](./assets/image.png)
```

**Q: Can I use HTML?**  
A: Stick to markdown for compatibility. Some agents may not render HTML.

**Q: How do I reference other files?**  
A: Use relative paths from your skill root:
```
./references/api.md
./scripts/helper.sh
./assets/template.txt
```

## Next Steps

1. ✅ Create your skill with `npx ralphy-skills create`
2. ✅ Follow this template structure
3. ✅ Test with `npx ralphy-skills validate`
4. ✅ Install locally with `npx ralphy-skills install ./my-skill`
5. ✅ Share on the central marketplace!

---

Made with ❤️ by Ralphy Community
