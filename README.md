# ralphy-skills

🚀 **The #1 Universal Skills CLI for AI Coding Agents**

Install, manage, and sync AI agent skills from the terminal. Works with **15+ AI coding tools** including Cursor, VS Code + Copilot, Claude Code, Windsurf, Gemini CLI, Aider, OpenCode, Codex CLI, Amp, Goose, Letta, Trae, Qoder, CodeBuddy, and Antigravity.

[![npm version](https://badge.fury.io/js/ralphy-skills.svg)](https://www.npmjs.com/package/ralphy-skills)
[![Downloads](https://img.shields.io/npm/dm/ralphy-skills.svg)](https://www.npmjs.com/package/ralphy-skills)

## ✨ What's New in v2.2.0

- 🔍 **Interactive Search** - Beautiful TUI search with @clack/prompts
- 🤖 **15 AI Clients** - Support for all major AI coding tools
- 🌐 **Our Own Registry** - Using marketplace.json as source of truth
- ⚡ All previous features from v2.1.0 (doctor, init, export, toggle, config, lock, import)

## Installation

```bash
# Use with npx (no installation needed)
npx ralphy-skills doctor

# Or install globally
npm install -g ralphy-skills
```

## 🩺 Quick Start

```bash
# 1. Diagnose your environment
npx ralphy-skills doctor

# 2. Initialize your project
npx ralphy-skills init

# 3. Install skills
npx ralphy-skills install vercel-react-best-practices

# 4. Sync AGENTS.md
npx ralphy-skills sync
```

## 📋 Commands

### Core Commands

| Command | Description |
|---------|-------------|
| `install <skill>` | Install a skill by name, URL, or local path |
| `list` | List installed skills |
| `list --registry` | Browse available skills from registry |
| `search <query>` | Search for skills |
| `update` | Update all installed skills |
| `remove <skill>` | Remove a skill |
| `manage` | Interactive TUI for skill management |

### Agent Integration

| Command | Description |
|---------|-------------|
| `sync` | Update AGENTS.md with installed skills |
| `read <skill>` | Read skill content to stdout (for AI agents) |
| `export --all` | Export skills to all detected AI tools |
| `doctor` | Diagnose environment and detect AI tools |

### Project Setup

| Command | Description |
|---------|-------------|
| `init` | Initialize project with skill support |
| `create` | Create a new skill from template |
| `validate` | Validate skill format and structure |

### Advanced

| Command | Description |
|---------|-------------|
| `enable <skill>` | Enable a disabled skill |
| `disable <skill>` | Disable a skill without removing |
| `toggle` | Interactive skill enable/disable |
| `lock` | Generate lock file for reproducible installations |
| `lock restore` | Restore skills from lock file |
| `import <file>` | Import skills from manifest file |
| `config` | Manage CLI configuration |

## 🩺 Doctor Command

Diagnose your environment and detect installed AI coding tools:

```bash
npx ralphy-skills doctor
```

Output:
```
🩺 Ralphy Skills Doctor

🔍 Detected AI Coding Tools:
  ✅ 🖱️ Cursor (v1.2.3)
      Skills path: .cursor/rules
  ✅ 🤖 Claude Code
      Skills path: .claude/skills

📂 Environment Summary:
  📁 Project: /path/to/project
  📦 Skills Directory: ✓ exists
  📄 AGENTS.md: ✓ exists
  🔢 Installed Skills: 5

💡 Recommendations:
  • Run 'npx ralphy-skills sync' to update AGENTS.md
```

## 📤 Multi-Agent Export

Export skills to all your AI coding tools at once:

```bash
# Export to all detected tools
npx ralphy-skills export --all

# Export to specific tools
npx ralphy-skills export --cursor --claude --copilot

# Preview without changes
npx ralphy-skills export --all --dry-run
```

## 🔒 Lock Files

Create reproducible skill installations (like package-lock.json):

```bash
# Generate lock file
npx ralphy-skills lock

# Restore from lock file
npx ralphy-skills lock restore

# Check lock file status
npx ralphy-skills lock check
```

## 📥 Bulk Import

Import multiple skills from a manifest file:

```bash
# Import from skills.json
npx ralphy-skills import skills.json

# Generate manifest from installed skills
npx ralphy-skills import --generate
```

**skills.json format:**
```json
{
  "skills": [
    { "url": "https://github.com/user/repo/skills/my-skill" },
    { "id": "vercel-react-best-practices" }
  ]
}
```

## ⚙️ Configuration

Manage global CLI settings:

```bash
# Show all settings
npx ralphy-skills config list

# Set a value
npx ralphy-skills config set defaultScope universal

# Interactive editor
npx ralphy-skills config edit
```

**Available settings:**
- `defaultScope` - Where to install skills (universal|global|project)
- `autoSync` - Auto-sync AGENTS.md after install/remove
- `registryUrl` - Custom registry URL
- `cacheEnabled` - Enable registry caching
- `cacheTTL` - Cache time-to-live in hours

## 🌐 Web Interface

Browse skills through a beautiful web interface:

```bash
npx ralphy-skills serve
```

Features:
- Skills browser with grid layout
- SEO-friendly URLs (/skill/skill-name)
- Search and filter
- Mobile responsive

## 🎯 Supported AI Tools

| Tool | Detection | Export |
|------|-----------|--------|
| Cursor | ✅ | ✅ |
| VS Code + Copilot | ✅ | ✅ |
| Claude Code | ✅ | ✅ |
| Windsurf | ✅ | ✅ |
| Aider | ✅ | ✅ |
| Gemini CLI | ✅ | ✅ |
| OpenCode | ✅ | ✅ |
| OpenAI Codex CLI | ✅ | ✅ |

## Related

- [Ralphy.sh VS Code Extension](https://marketplace.visualstudio.com/items?itemName=Ralphysh.ralphy-sh) - GUI-based skill management

## License

MIT
