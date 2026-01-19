# 🚀 Ralphy Skills - Universal AI Skills Marketplace

<div align="center">

**The #1 Open Source Skills Marketplace for AI Coding Agents**

[![npm version](https://img.shields.io/npm/v/ralphy-skills.svg)](https://www.npmjs.com/package/ralphy-skills)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/ralphy-skills.svg)](https://www.npmjs.com/package/ralphy-skills)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Web Browser](#-web-based-skills-browser) • [Documentation](#-documentation)

</div>

---

## 🌟 What Makes Ralphy Skills #1?

### ✨ **Unique Features No Other Skills Marketplace Has:**

1. **🌐 Web-Based Browser** - Beautiful web interface to browse and discover skills
2. **🔧 Skill Creation Tools** - CLI scaffolding with interactive templates
3. **✅ Validation System** - Ensure your skills meet quality standards
4. **📊 REST API** - Programmatic access to your skills library
5. **🔐 Private Repository Support** - Enterprise-ready with SSH/token auth
6. **🎨 Interactive TUI** - Terminal UI for visual skill management
7. **📤 Multi-Format Export** - JSON, YAML, CSV, Markdown outputs
8. **🔍 Advanced Search** - Filter by category, tags, popularity
9. **🤖 Multi-Agent Support** - Works with ALL AI coding assistants

---

## 🎯 Features

### **Core Features**
- 📦 **Install** skills from registry, GitHub, or local directories
- 📋 **List** installed and available skills
- 🔍 **Search** with advanced filters and sorting
- 🔄 **Update** all or specific skills
- 🗑️ **Remove** skills with interactive management
- 📝 **Read** skills on-demand (for AI agents)
- 🔄 **Sync** to generate AGENTS.md for AI agents

### **Advanced Features (v2.0)**
- 🌐 **Web Browser** - Start a local web server to browse skills visually
- 🔧 **Create** - Scaffold new skills with interactive CLI
- ✅ **Validate** - Check skill format and quality score
- 🔐 **Private Repos** - SSH keys, tokens, username/password auth
- 🚀 **CI/CD Ready** - `--yes`, `--dry-run`, JSON output, exit codes
- 📊 **Multi-Format** - Export to JSON, YAML, CSV
- 🎨 **Interactive TUI** - Beautiful terminal interface

---

## 📥 Installation

```bash
# Use with npx (recommended - no installation needed)
npx ralphy-skills list

# Or install globally
npm install -g ralphy-skills

# Verify installation
ralphy-skills --version
```

---

## 🚀 Usage

### **Web-Based Skills Browser** 🌐 **NEW!**

Start a local web server to browse skills in your browser:

```bash
npx ralphy-skills serve
# Opens http://localhost:3000

# Custom port
npx ralphy-skills serve --port 8080
```

**Features:**
- 🎨 Beautiful, responsive web interface
- 🔍 Real-time search with filtering
- 📊 Statistics dashboard
- 🏷️ Category-based browsing
- 📱 Mobile-friendly design

---

### **Create a New Skill** 🔧 **NEW!**

Scaffold a new skill with interactive prompts:

```bash
npx ralphy-skills create my-awesome-skill

# Or let the wizard guide you
npx ralphy-skills create
```

This creates:
- ✅ `SKILL.md` with proper frontmatter
- ✅ `marketplace.json` for registry submission
- ✅ `README.md` with installation instructions
- ✅ Optional `examples/`, `references/`, `tests/` directories

---

### **Validate a Skill** ✅ **NEW!**

Check if your skill meets quality standards:

```bash
# Validate current directory
npx ralphy-skills validate

# Validate specific skill
npx ralphy-skills validate ./my-skill

# Strict mode (fail on warnings)
npx ralphy-skills validate --strict
```

**Quality Score:** Get a score out of 100 based on:
- Required fields presence
- Documentation completeness
- Code examples
- Best practices compliance

---

### **Install Skills**

```bash
# From registry
npx ralphy-skills install vercel-react-best-practices

# From GitHub URL
npx ralphy-skills install https://github.com/v0-ai/agent-skills/tree/main/skills/react

# From local directory (for development)
npx ralphy-skills install ./my-custom-skill --symlink

# Install locations
npx ralphy-skills install skill-name --universal  # .agent/skills
npx ralphy-skills install skill-name --global     # ~/.ralphy/skills
npx ralphy-skills install skill-name --cursor     # .cursor/rules

# Private repositories (Enterprise)
npx ralphy-skills install private-skill --token YOUR_GITHUB_TOKEN
npx ralphy-skills install git@github.com:org/private-skill.git --private
npx ralphy-skills install private-skill --ssh-key ~/.ssh/id_ed25519

# CI/CD automation
npx ralphy-skills install skill-name --yes  # Skip all prompts
```

---

### **List & Search Skills**

```bash
# List installed skills
npx ralphy-skills list

# List available skills from registry
npx ralphy-skills list --registry

# Search with filters
npx ralphy-skills search "react"
npx ralphy-skills search "react" --category development --sort popularity
npx ralphy-skills search "testing" --tags unit,integration --limit 10

# Export search results
npx ralphy-skills search "react" --export json
npx ralphy-skills search "react" --export csv
```

---

### **Interactive Management**

```bash
# Interactive TUI for managing skills
npx ralphy-skills manage
```

Features:
- ✅ Multi-select for bulk operations
- 🔍 Search while browsing
- 📊 Detailed skill information
- 🗑️ Bulk removal with confirmation
- 📤 Export skill lists

---

### **Update Skills**

```bash
# Update all installed skills
npx ralphy-skills update

# Update specific skill
npx ralphy-skills update --skill react-best-practices
```

---

### **Sync for AI Agents**

Generate an `AGENTS.md` file that AI agents can read:

```bash
# Generate AGENTS.md
npx ralphy-skills sync

# Custom output file
npx ralphy-skills sync --output SKILLS.md

# Multiple formats
npx ralphy-skills sync --format json
npx ralphy-skills sync --format yaml
npx ralphy-skills sync --format markdown

# Dry run (preview without writing)
npx ralphy-skills sync --dry-run

# Include metadata
npx ralphy-skills sync --include-metadata --format json
```

---

### **Read Skills (For AI Agents)**

AI agents can load skills on-demand:

```bash
# Read single skill
npx ralphy-skills read react-best-practices

# Read multiple skills (comma-separated)
npx ralphy-skills read "react,typescript,testing"
```

---

## 🤖 Supported AI Agents

Ralphy Skills works with **ALL** AI coding assistants:

- ✅ **Claude Code** (Anthropic)
- ✅ **Cursor** (cursor.com)
- ✅ **Windsurf** (Codeium)
- ✅ **Aider** (aider.chat)
- ✅ **GitHub Copilot** (VS Code)
- ✅ **Continue.dev**
- ✅ **Cody** (Sourcegraph)
- ✅ **Any AI coding assistant**

---

## 📊 Web API Endpoints

When running `ralphy-skills serve`, you get a REST API:

```bash
GET  /api/skills           # List all installed skills
GET  /api/skills/:id       # Get skill details
GET  /api/registry         # List registry skills
GET  /api/search?q=...     # Search skills
GET  /api/stats            # Get statistics
```

**Example:**
```bash
curl http://localhost:3000/api/skills
curl http://localhost:3000/api/search?q=react&category=development
curl http://localhost:3000/api/stats
```

---

## 🎨 Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `serve` | Start web browser | `ralphy-skills serve --port 3000` |
| `create` | Create new skill | `ralphy-skills create my-skill` |
| `validate` | Validate skill | `ralphy-skills validate ./skill` |
| `install` | Install skill | `ralphy-skills install skill-name` |
| `list` | List skills | `ralphy-skills list --registry` |
| `search` | Search skills | `ralphy-skills search "react"` |
| `manage` | Interactive TUI | `ralphy-skills manage` |
| `update` | Update skills | `ralphy-skills update` |
| `sync` | Generate AGENTS.md | `ralphy-skills sync --format json` |
| `read` | Read skill | `ralphy-skills read skill-name` |
| `remove` | Remove skill | `ralphy-skills remove skill-name` |

---

## 🔥 Why Ralphy Skills is #1

### **vs OpenSkills**
| Feature | Ralphy Skills v2.0 | OpenSkills |
|---------|-------------------|------------|
| Web Browser | ✅ **Yes** | ❌ No |
| Skill Creator | ✅ **Yes** | ❌ No |
| Validation | ✅ **Yes** | ❌ No |
| API Server | ✅ **Yes** | ❌ No |
| Private Repos | ✅ **Yes** (SSH/Token) | ❌ No |
| Interactive TUI | ✅ **Advanced** | ⚠️ Basic |
| Multi-Format Export | ✅ **4 formats** | ❌ No |
| Advanced Search | ✅ **Yes** | ❌ No |
| CI/CD Ready | ✅ **Yes** | ⚠️ Partial |

### **Unique Differentiators**
1. 🌐 **Only skills marketplace with web interface**
2. 🔧 **Built-in skill creation tools**
3. ✅ **Quality validation system**
4. 📊 **REST API for integrations**
5. 🔐 **Enterprise-ready private repo support**
6. 🎨 **Beautiful terminal UI**
7. 📤 **Export to any format**

---

## 📚 Documentation

- [Creating Skills Guide](./docs/CREATING_SKILLS.md)
- [Contributing](./CONTRIBUTING.md)
- [Feature Comparison](./FEATURE_COMPARISON.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)

---

## 🌍 Community & Marketplace

### **Submit Your Skills**
1. Create a skill: `npx ralphy-skills create`
2. Validate it: `npx ralphy-skills validate`
3. Publish to GitHub
4. Submit PR to [ralphy-central-skills](https://github.com/Interpoolx/ralphy-central-skills)

### **Browse Skills**
- 🌐 [Web Marketplace](https://ralphy.sh/marketplace) (Coming Soon)
- 📦 [Central Repository](https://github.com/Interpoolx/ralphy-central-skills)
- 🔍 [Search Registry](https://github.com/Interpoolx/ralphy-skills#search)

---

## 🛠️ Development

```bash
# Clone repository
git clone https://github.com/Interpoolx/ralphy-skills.git
cd ralphy-skills

# Install dependencies
npm install

# Build
npm run build

# Test locally
npm start list

# Start web server
npm run serve
```

---

## 📦 Publishing to npm

```bash
# Build and test
npm run build
npm test

# Publish to npm (requires npm login)
npm publish

# Or publish beta version
npm publish --tag beta
```

**Pre-publish Checklist:**
- ✅ Update version in `package.json`
- ✅ Run `npm run build`
- ✅ Test all commands
- ✅ Update `CHANGELOG.md`
- ✅ Commit and tag release
- ✅ `npm publish`

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Ways to Contribute:**
- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🔧 Create new skills
- 🎨 Improve UI/UX
- ✅ Add tests

---

## 📈 Roadmap

### **v2.0** (Current)
- ✅ Web-based skills browser
- ✅ Skill creation tools
- ✅ Validation system
- ✅ REST API

### **v2.1** (Next)
- [ ] Skill ratings & reviews
- [ ] Analytics dashboard
- [ ] Automated testing
- [ ] Skill dependencies
- [ ] Version management

### **v2.2** (Future)
- [ ] Community marketplace website
- [ ] GitHub Actions integration
- [ ] VS Code extension sync
- [ ] Skill templates library

---

## 📄 License

MIT © [Ralphysh](https://ralphy.sh)

---

## 🔗 Links

- 🌐 **Website:** [ralphy.sh](https://ralphy.sh)
- 📦 **NPM:** [npmjs.com/package/ralphy-skills](https://www.npmjs.com/package/ralphy-skills)
- 💻 **GitHub:** [github.com/Interpoolx/ralphy-skills](https://github.com/Interpoolx/ralphy-skills)
- 📚 **Marketplace:** [github.com/Interpoolx/ralphy-central-skills](https://github.com/Interpoolx/ralphy-central-skills)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/Interpoolx/ralphy-skills/discussions)
- 🐛 **Issues:** [GitHub Issues](https://github.com/Interpoolx/ralphy-skills/issues)

---

<div align="center">

**Made with ❤️ by the Ralphy community**

⭐ **Star us on GitHub** • 🐦 **Follow [@ralphysh](https://twitter.com/ralphysh)** • 💬 **Join the Discussion**

</div>
