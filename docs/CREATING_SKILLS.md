# Creating Skills - Complete Guide

Learn how to create, test, and submit skills for the Ralphy-Skills marketplace.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Skill Structure](#skill-structure)
3. [SKILL.md Format](#skillmd-format)
4. [marketplace.json](#marketplacejson)
5. [Best Practices](#best-practices)
6. [Testing & Validation](#testing--validation)
7. [Submission](#submission)
8. [Examples](#examples)

---

## Quick Start

### Create a Skill in 30 Seconds

```bash
# 1. Generate skill scaffold
npx ralphy-skills create my-skill

# 2. Edit SKILL.md with your instructions
cd my-skill
nano SKILL.md

# 3. Validate format
npx ralphy-skills validate .

# 4. Install & test
npx ralphy-skills install .

# 5. Submit to marketplace
npx ralphy-skills submit .
```

### Using Templates

```bash
# Basic skill (minimal)
npx ralphy-skills create my-skill --template basic

# Full-featured (with all resources)
npx ralphy-skills create my-skill --template full

# Specific type
npx ralphy-skills create my-skill --template tool      # Tool integration
npx ralphy-skills create my-skill --template workflow  # Multi-step workflow
npx ralphy-skills create my-skill --template integration # Service integration
```

---

## Skill Structure

### Minimal Skill (required)

```
my-skill/
├── SKILL.md              # Main instructions (REQUIRED)
└── marketplace.json      # Metadata (REQUIRED)
```

**Estimated time**: 15 minutes to create

### Basic Skill

```
my-skill/
├── SKILL.md
├── marketplace.json
└── references/
    └── detailed-guide.md
```

**Estimated time**: 1-2 hours

### Full-Featured Skill

```
my-skill/
├── SKILL.md
├── marketplace.json
├── references/
│   ├── api-reference.md
│   ├── examples.md
│   └── troubleshooting.md
├── scripts/
│   ├── setup.sh
│   ├── helper.js
│   └── test.sh
├── assets/
│   ├── templates/
│   ├── config-examples/
│   └── screenshots/
└── tests/
    ├── skill.test.ts
    └── fixtures/
```

**Estimated time**: 4-8 hours

### With Dependencies

```
my-skill/
├── SKILL.md
├── marketplace.json
├── package.json       # If using Node.js
├── requirements.txt   # If using Python
└── Dockerfile        # Optional container
```

---

## SKILL.md Format

### Frontmatter (YAML)

```yaml
---
name: skill-id                    # REQUIRED: kebab-case identifier
description: One-line purpose     # REQUIRED: displayed in search results
version: 1.0.0                    # REQUIRED: semantic versioning
keywords: [tag1, tag2]            # REQUIRED: searchable keywords
author:                           # RECOMMENDED: credit creator
  name: Your Name
  github: github-username
  email: you@example.com
category: development             # RECOMMENDED: automation|development|workflow|tools|utilities|integration|productivity
compatible_agents:                # RECOMMENDED: list supported agents
  - claude-code
  - cursor
  - windsurf
  - aider
requirements: [nodejs>=16, git]   # OPTIONAL: system requirements
tags:                             # OPTIONAL: additional tags
  - beginner-friendly
  - no-dependencies
license: MIT                       # OPTIONAL: skill license
---
```

### Content (Markdown)

```markdown
# Skill Title

One-sentence summary.

## Purpose

Explain the problem this solves.

## When to Use

List conditions for loading/using this skill.

## Requirements

- System/runtime requirements
- External dependencies
- Knowledge prerequisites

## Quick Start

Step-by-step instructions (3-5 steps).

```bash
# Example code
code here
```

## Advanced Usage

Deeper explanations, edge cases, advanced patterns.

## Resources

- `references/detailed-guide.md` for more info
- `scripts/helper.sh` for automation
- `assets/template.txt` for templates

## Troubleshooting

### Common Problem
Solution here.

## Next Steps

What to do after learning this skill.

---

Made with ❤️
```

### Writing Guidelines

✅ **DO:**
- Use imperative, infinitive form: "To create X, run..."
- Write clear, actionable steps
- Include examples and use cases
- Keep main content under 5,000 words
- Move detailed content to references/
- Document dependencies clearly
- Use code blocks with language hints

❌ **DON'T:**
- Use second person: "You should..." → "To X, run..."
- Assume too much user knowledge
- Make assumptions about environment
- Skip important error handling
- Forget to update version number
- Use unclear technical jargon
- Submit untested content

### Content Organization

**Keep It Focused**: One skill = one domain
```
❌ BAD: "Complete Web Development"
✅ GOOD: "React Best Practices"
```

**Structure Clearly**: Use consistent headings
```
# Title
## Purpose
## When to Use
## Quick Start
## Advanced Usage
## Resources
## Troubleshooting
```

**Show, Don't Tell**: Use examples
```
❌ "You can use conditional statements"
✅ "To conditionally render: if (condition) { return <Component /> }"
```

---

## marketplace.json

Define skill metadata:

```json
{
  "id": "skill-id",
  "name": "Display Name",
  "description": "One-line purpose",
  "version": "1.0.0",
  "category": "development",
  "tags": ["tag1", "tag2"],
  "author": {
    "name": "Your Name",
    "github": "username",
    "email": "you@example.com"
  },
  "keywords": ["searchable", "terms"],
  "source": "https://github.com/user/repo/tree/main/skill-name",
  "documentation": "https://docs-url",
  "requirements": ["nodejs>=16"],
  "compatible_agents": ["claude-code", "cursor", "windsurf"],
  "dependencies": [],
  "structure": {
    "main": "SKILL.md",
    "references": ["references/guide.md"],
    "scripts": ["scripts/setup.sh"],
    "assets": ["assets/template.txt"]
  },
  "metadata": {
    "created_at": "2026-01-19T00:00:00Z",
    "updated_at": "2026-01-19T00:00:00Z",
    "verified": false,
    "featured": false
  }
}
```

---

## Best Practices

### 1. Naming

**Skill ID** (in name and marketplace.json):
- Kebab-case: `react-best-practices`
- Unique and memorable
- Descriptive: `git-workflow` vs `vcs`

**File Structure**:
- Lowercase directory names
- Use hyphens (not underscores)
- No spaces

### 2. Documentation

**Do**:
- ✅ Write for beginners AND experts
- ✅ Include real examples
- ✅ Link to additional resources
- ✅ Explain why, not just how
- ✅ Use consistent formatting

**Don't**:
- ❌ Leave undocumented code
- ❌ Assume context
- ❌ Mix multiple topics
- ❌ Write "see Google for details"

### 3. Skill Size

| Component | Recommended | Maximum |
|-----------|-------------|---------|
| SKILL.md | 2,000 words | 5,000 words |
| Single reference | 3,000 words | 5,000 words |
| Total skill | 15,000 words | 20,000 words |
| Scripts | 200 lines | No limit |

*Move excess content to references/*

### 4. Testing

**Before submission, ensure**:
- ✅ All code examples work
- ✅ No broken links
- ✅ Steps are reproducible
- ✅ No undefined variables/commands
- ✅ Works on macOS, Linux, Windows

### 5. Version Management

Use semantic versioning:
- `1.0.0` - Major.Minor.Patch
- `MAJOR` - Breaking changes
- `MINOR` - New features
- `PATCH` - Bug fixes

```
1.0.0 → Initial release
1.1.0 → New feature added
1.1.1 → Bug fix
2.0.0 → Breaking change
```

### 6. Agent Compatibility

Test on all agents you list:
- [ ] Claude Code
- [ ] Cursor
- [ ] Windsurf
- [ ] Aider
- [ ] Codex (if applicable)

### 7. Accessibility

- [ ] Use clear headings (h1 > h2 > h3)
- [ ] Include alt text for images
- [ ] Use descriptive link text
- [ ] Test on mobile (if applicable)
- [ ] Avoid color-only information

---

## Testing & Validation

### Validate Format

```bash
# Check SKILL.md format
npx ralphy-skills validate ./my-skill

# Validate specific file
npx ralphy-skills validate ./my-skill/SKILL.md

# Verbose output
npx ralphy-skills validate ./my-skill -v
```

### Local Testing

```bash
# Install locally
npx ralphy-skills install ./my-skill

# Load your skill (as if agent is using it)
npx ralphy-skills read my-skill

# List to verify
npx ralphy-skills list | grep my-skill
```

### Manual Checklist

- [ ] SKILL.md has valid frontmatter
- [ ] All code examples are tested
- [ ] Links don't have typos
- [ ] Required files exist
- [ ] marketplace.json is valid JSON
- [ ] No sensitive info exposed
- [ ] Works on target agents
- [ ] Follows naming conventions

---

## Submission

### Before Submitting

1. **Test thoroughly**
   ```bash
   npx ralphy-skills validate ./my-skill
   npx ralphy-skills install ./my-skill
   npx ralphy-skills read my-skill
   ```

2. **Check requirements**
   - Skills must pass validation
   - Complete documentation required
   - Must work on at least 2 agents
   - No sensitive information
   - Follow SKILL.md format

3. **Prepare files**
   ```bash
   # Ensure directory structure is correct
   ls my-skill/
   # Should show: SKILL.md, marketplace.json, [optional resources]
   ```

### Submit to Marketplace

```bash
# Interactive submission process
npx ralphy-skills submit ./my-skill

# This will:
# 1. Validate your skill
# 2. Create GitHub issue in central repo
# 3. Guide through PR process
# 4. Add to marketplace.json after approval
```

### Submission Process

1. **Create Issue**: Describe your skill
2. **Get Feedback**: Community reviews
3. **Make Changes**: Address feedback
4. **PR Creation**: Submit changes
5. **Merge**: Added to marketplace
6. **Published**: Available for installation

### What Gets Reviewed

- ✅ **Code Quality**: Examples work correctly
- ✅ **Documentation**: Clear and complete
- ✅ **Format**: Follows SKILL.md standard
- ✅ **Compatibility**: Works on listed agents
- ✅ **Usefulness**: Solves real problem
- ✅ **Originality**: Unique/non-duplicate

---

## Examples

### Example 1: Tool Integration

```markdown
---
name: stripe-integration
description: Integrate Stripe payments into your application
keywords: [stripe, payments, billing]
---

# Stripe Integration

## Purpose
Add payment processing to your app using Stripe API.

## Quick Start

1. Create Stripe account
2. Get API keys
3. Install SDK
4. Implement checkout

## Resources
- references/api-guide.md
- scripts/setup.sh
```

### Example 2: Workflow Automation

```markdown
---
name: github-workflow
description: Automate GitHub with Actions workflows
keywords: [github, automation, ci-cd]
---

# GitHub Workflow Automation

## Purpose
Set up automated testing, building, and deployment.

## Quick Start

1. Create .github/workflows/
2. Add workflow file
3. Define triggers
4. Test workflow

## Resources
- references/workflow-examples.md
- scripts/validate-workflow.sh
```

### Example 3: Learning Guide

```markdown
---
name: typescript-fundamentals
description: Learn TypeScript from basics to advanced
keywords: [typescript, learning, fundamentals]
---

# TypeScript Fundamentals

## Purpose
Master TypeScript language features.

## Quick Start

1. Install TypeScript
2. Learn basic types
3. Practice with exercises
4. Build first project

## Resources
- references/type-system.md
- scripts/exercise-templates/
- assets/cheat-sheet.pdf
```

---

## Troubleshooting

### Q: How do I reference files?

Use relative paths from your skill root:
```markdown
See [API Docs](./references/api.md)
Run [Setup](./scripts/setup.sh)
Use [Template](./assets/template.txt)
```

### Q: Can I use images?

Yes! Store in `assets/` and reference:
```markdown
![Description](./assets/image.png)
```

### Q: How long should SKILL.md be?

Keep main file 2,000-5,000 words. Move extended content to references/:
- Detailed API docs → references/api.md
- Examples → references/examples.md
- Troubleshooting → references/troubleshooting.md

### Q: What if my skill has dependencies?

Document in:
1. `requirements` field in marketplace.json
2. "Requirements" section in SKILL.md
3. Installation steps (with package managers)

### Q: How often should I update?

- Update version when you make changes
- Follow semantic versioning
- Test thoroughly before publishing
- Document changes in pull request

---

## Next Steps

1. ✅ Choose template or start from scratch
2. ✅ Write SKILL.md following guidelines
3. ✅ Create marketplace.json
4. ✅ Validate format
5. ✅ Test locally
6. ✅ Submit to marketplace

**Ready to create your skill?**

```bash
npx ralphy-skills create my-skill --template basic
```

---

**Questions?** Open an issue: [github.com/Interpoolx/ralphy-skills/issues](https://github.com/Interpoolx/ralphy-skills/issues)

**Want to contribute?** See [CONTRIBUTING.md](../CONTRIBUTING.md)
