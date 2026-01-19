# Ralphy-Skills

🚀 **Universal Skills Manager for AI Coding Agents**

Install, manage, and share skills across Claude Code, Cursor, Windsurf, Aider, and any AI coding assistant. Works with Anthropic's SKILL.md format.

[![npm version](https://img.shields.io/npm/v/ralphy-skills.svg)](https://www.npmjs.com/package/ralphy-skills)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Interpoolx/ralphy-skills)](https://github.com/Interpoolx/ralphy-skills)

**[Quick Start](#-quick-start)** · **[Features](#-features)** · **[Commands](#-commands)** · **[Create Skills](#-creating-skills)** · **[Marketplace](#-marketplace)** · **[Docs](#-documentation)**

---

## ✨ Why Ralphy-Skills?

- **🎯 Universal Format** — Works with Anthropic's SKILL.md standard (Claude Code, Cursor, Windsurf, Aider)
- **🔍 Progressive Disclosure** — Load skills only when needed; keeps context clean
- **📦 Central Marketplace** — 50+ community-contributed skills (growing!)
- **🛠️ Interactive Management** — Browse, search, and manage skills with beautiful TUI
- **🔐 Private Repos** — Install from SSH, GitHub tokens, or private registries
- **⚡ CI/CD Ready** — Non-interactive mode, JSON output, exit codes
- **🎨 Developer Experience** — Skill scaffolder, validation, auto-docs
- **🌱 Thriving Ecosystem** — Community contributions, GitHub Actions, VS Code extension

---

## 🚀 Quick Start

### Installation

```bash
# Use with npx (no installation needed)
npx ralphy-skills list

# Or install globally
npm install -g ralphy-skills
```

### Install Your First Skill

```bash
# From central marketplace
npx ralphy-skills install react-best-practices

# From GitHub
npx ralphy-skills install github-username/my-skills/my-skill

# From private repo (with token)
npx ralphy-skills install git@github.com:org/private-skills.git

# From local folder
npx ralphy-skills install ./local-skill --symlink
```

### Generate Skills Menu for Your Agent

```bash
npx ralphy-skills sync
# Creates/updates AGENTS.md with available skills
```

### Load a Skill (AI Agent)

```bash
npx ralphy-skills read react-best-practices
# Outputs skill content for agent to use
```

---

## 🎯 Features

| Feature | Ralphy | OpenSkills | Notes |
|---------|--------|-----------|-------|
| **Interactive Management** | ✅ | ❌ | Browse & manage skills with beautiful UI |
| **Private Repositories** | ✅ | ✅ | SSH, tokens, custom auth |
| **Central Marketplace** | ✅ | ❌ | 50+ community skills |
| **Skill Scaffolder** | ✅ | ❌ | Create new skills with `create` command |
| **Advanced Search** | ✅ | ❌ | Full-text + tag filtering |
| **CI/CD Ready** | ✅ | ✅ | `-y`, JSON output, exit codes |
| **Multiple Output Formats** | ✅ | ✅ | JSON, YAML, AGENTS.md |
| **Skill Validation** | ✅ | ❌ | Validates SKILL.md format |
| **VS Code Integration** | ✅ | ❌ | Via Ralphy VS Code extension |
| **Documentation Generator** | ✅ | ❌ | Auto-generate skill docs |
| **Workspace Sync** | ✅ | ❌ | Multi-project skill sharing |

---

## 🧰 Commands

```bash
# Installation & Management
npx ralphy-skills install <source>           # Install from registry, GitHub, or local
npx ralphy-skills list [--registry]          # List installed or available skills
npx ralphy-skills manage                     # Interactive skill browser & manager
npx ralphy-skills remove <skill-id>          # Remove specific skill
npx ralphy-skills update [skill-ids...]      # Update installed skills

# Usage
npx ralphy-skills read <skill-id>            # Load skill for agents
npx ralphy-skills sync                       # Generate AGENTS.md with available skills
npx ralphy-skills search <query>             # Search skills by name/tags

# Development
npx ralphy-skills create <skill-name>        # Scaffold new skill
npx ralphy-skills validate <path>            # Validate SKILL.md format
npx ralphy-skills submit <path>              # Submit skill to marketplace

# Utilities
npx ralphy-skills version                    # Show version
npx ralphy-skills help [command]             # Show help
```

### Flags & Options

```bash
# Installation
--global              # Install to ~/.ralphy/skills (global)
--universal           # Install to .agent/skills (multi-agent)
--symlink             # Create symlink (local development)

# Automation & Output
-y, --yes             # Skip prompts (CI-friendly)
-f, --force           # Overwrite without confirmation
-o, --output <path>   # Custom output path for sync
--format <type>       # Output format: agents.md | json | yaml

# Search & Filter
--tags <tag1,tag2>    # Filter by tags
--category <cat>      # Filter by category
--author <name>       # Filter by author
--installed           # Show only installed skills
--not-installed       # Show only available skills
```

---

## 📦 Installation Locations

By default, Ralphy-Skills installs to your project:

```
./.agent/skills/              # Universal agents (Claude Code, Cursor, Windsurf)
./.claude/skills/             # Claude Code compatible
~/.ralphy/skills              # Global install
```

### Installation Priority (what gets loaded)

1. `./.agent/skills/` (project universal) — highest priority
2. `~/.agent/skills/` (global universal)
3. `./.claude/skills/` (project Claude)
4. `~/.claude/skills/` (global Claude)

---

## 🪴 Creating Skills

### Minimal Skill (30 seconds)

```bash
npx ralphy-skills create my-skill
cd my-skill
```

This creates:
```
my-skill/
├── SKILL.md           # Your skill instructions
└── marketplace.json   # Skill metadata
```

Edit `SKILL.md`:
```markdown
---
name: my-skill
description: What does this skill do?
keywords: [tag1, tag2]
---

# My First Skill

## Purpose
Explain what this does.

## Instructions
1. Step one
2. Step two
3. Done!
```

### Full-Featured Skill

```bash
npx ralphy-skills create my-skill --template full
```

Includes:
```
my-skill/
├── SKILL.md
├── marketplace.json
├── references/
│   ├── api-reference.md
│   └── examples.md
├── scripts/
│   └── helper.sh
├── assets/
│   └── template.txt
└── tests/
    └── skill.test.ts
```

### SKILL.md Frontmatter

```yaml
---
name: skill-id                    # Unique identifier (kebab-case)
description: One-line purpose     # What this does
version: 1.0.0                    # Semantic versioning
keywords: [tag1, tag2]            # Search tags
author:
  name: Your Name
  github: username
  email: you@example.com
requirements: [nodejs>=16, git]   # System requirements
compatible_agents:                # Works with
  - claude-code
  - cursor
  - windsurf
  - aider
category: development             # automation|development|workflow|tools|utility
tags:
  - beginner-friendly
  - no-dependencies
---
```

### Best Practices

✅ **DO:**
- Keep SKILL.md under 5,000 words (move details to references/)
- Use imperative form: "To create X, run Y"
- Include examples and troubleshooting
- Test thoroughly before submitting
- Document dependencies clearly
- Include quick start section

❌ **DON'T:**
- Use second person ("You should do...")
- Make assumptions about user's environment
- Forget to update version number
- Submit untested skills
- Ignore validation warnings

---

## 🏪 Marketplace

### Install from Central Marketplace

```bash
# Browse available skills
npx ralphy-skills list --registry

# Install by ID
npx ralphy-skills install react-best-practices

# Install with search
npx ralphy-skills search "react" --install
```

### Submit Your Skill

```bash
# Create & test your skill
npx ralphy-skills create my-skill
# ... edit & test ...

# Validate before submitting
npx ralphy-skills validate ./my-skill

# Submit to marketplace
npx ralphy-skills submit ./my-skill

# This will:
# 1. Validate SKILL.md format
# 2. Check compatibility
# 3. Create GitHub issue with skill
# 4. Auto-create PR if approved
# 5. Add to central marketplace
```

### Marketplace Standards

Skills in the marketplace must:
- ✅ Pass validation checks
- ✅ Have complete documentation
- ✅ Include examples
- ✅ Work on at least 2 agents
- ✅ Use semantic versioning
- ✅ Include author metadata

---

## 📚 Documentation

### For Users
- **[Getting Started](docs/getting-started.md)** — Installation & first steps
- **[CLI Reference](docs/cli-reference.md)** — All commands & flags
- **[Skill Directory](docs/skill-directory.md)** — Browse available skills
- **[FAQ](docs/faq.md)** — Common questions

### For Skill Creators
- **[Creating Skills](docs/creating-skills.md)** — Step-by-step guide
- **[SKILL.md Format](docs/skill-format.md)** — Complete specification
- **[Best Practices](docs/best-practices.md)** — Tips & tricks
- **[Marketplace Submission](docs/marketplace-submission.md)** — Submit your skill
- **[Examples](examples/)** — Real skill examples

### For Contributors
- **[Contributing Guide](CONTRIBUTING.md)** — Help us improve
- **[Development Setup](docs/development.md)** — Local setup
- **[Architecture](docs/architecture.md)** — How it works

---

## 🔐 Security

### Private Repositories

Install from private repos with multiple auth methods:

```bash
# SSH key (recommended for CI/CD)
npx ralphy-skills install git@github.com:org/private-skills.git

# GitHub personal access token
export GITHUB_TOKEN=your_token
npx ralphy-skills install https://github.com/org/private-skills.git

# Custom credentials file
npx ralphy-skills install <url> --credentials ~/.ssh/config
```

### Credential Security
- Credentials stored in `.ralphy-credentials.json` (git-ignored)
- Never committed to version control
- Uses system keychain when available
- Supports environment variables

---

## 🎨 Interactive Management

Browse and manage skills with beautiful TUI:

```bash
npx ralphy-skills manage
```

Features:
- 🔍 Search installed & available skills
- 📋 View skill details (size, version, author)
- 🗑️ Remove skills with confirmation
- 📦 Bulk operations
- 🔄 Update with one keystroke
- 🎯 Filter by category, tags, author

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Install Skills
on: [push]

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Ralphy Skills
        run: |
          npx ralphy-skills install my-skill -y
          npx ralphy-skills sync --format json -o skills.json
      
      - name: Commit AGENTS.md
        run: |
          git add AGENTS.md
          git commit -m "chore: update skills" || true
          git push
```

### Automation Flags

```bash
# Non-interactive mode
npx ralphy-skills install my-skill -y --force

# JSON output for parsing
npx ralphy-skills list --format json > skills.json

# Custom output path
npx ralphy-skills sync -o docs/available-skills.md

# Exit codes for scripting
npx ralphy-skills install my-skill -y
echo $?  # 0 = success, 1 = error
```

---

## 🤝 Community

- **GitHub**: [Interpoolx/ralphy-skills](https://github.com/Interpoolx/ralphy-skills)
- **Central Marketplace**: [Interpoolx/ralphy-central-skills](https://github.com/Interpoolx/ralphy-central-skills)
- **Issues**: [Report bugs](https://github.com/Interpoolx/ralphy-skills/issues)
- **Discussions**: [Ask questions](https://github.com/Interpoolx/ralphy-skills/discussions)
- **VS Code Extension**: [Ralphy.sh](https://marketplace.visualstudio.com/items?itemName=Ralphysh.ralphy-sh)

---

## 📋 Requirements

- **Node.js**: 16.0.0 or higher
- **Git**: 2.0.0 or higher
- **npm** or **yarn**

---

## 📜 License

MIT License — See [LICENSE](LICENSE) for details

---

## 🙏 Attribution

Built on [Anthropic's Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) specification.

Compatible with Claude Code, Cursor, Windsurf, Aider, and other AI coding agents.

---

## 🗺️ Roadmap

- [x] Core CLI (install, list, remove, sync)
- [x] Search functionality
- [ ] Interactive management (v1.2)
- [ ] Private Git repos (v1.2)
- [ ] Skill scaffolder (v1.3)
- [ ] Central marketplace (v1.3)
- [ ] Documentation generator (v1.4)
- [ ] Web UI (v2.0)

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for details.

---

**Made with ❤️ by the Ralphy community**
