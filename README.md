# ralphy-skills

🚀 **Universal Skills loader for AI Coding Agents**

Install and manage AI agent skills from the terminal. Works with Cursor, VS Code + Copilot, Claude Code, Windsurf, and any AI coding assistant.

## 🔥 Universal Skills Workflow (New in v1.1.0)

Ralphy now supports the **Read on Demand** workflow, allowing AI agents to browse a menu of skills and only load what they need.

1. **Sync**: Generate a menu for your AI agent
   ```bash
   npx ralphy-skills sync
   ```
   This creates/updates `AGENTS.md` with your available skills.

2. **Read**: AI agents can fetch skill content as needed
   ```bash
   npx ralphy-skills read <skill-name>
   ```

## Installation

```bash
# Use with npx (no installation needed)
npx ralphy-skills list

# Or install globally
npm install -g ralphy-skills
```

## Usage

### Install a skill

```bash
# Install by skill name (from registry)
npx ralphy-skills install vercel-react-best-practices

# Install from local folder (useful for development)
npx ralphy-skills install ./my-custom-skill --symlink

# Install to a specific location
npx ralphy-skills install vercel-react-best-practices --universal  # .agent/skills
npx ralphy-skills install vercel-react-best-practices --global     # ~/.ralphy/skills

# Install from GitHub URL
npx ralphy-skills install https://github.com/v0-ai/agent-skills/tree/main/skills/vercel-react-best-practices
```

### Manage installed skills

```bash
# List all your installed skills
npx ralphy-skills list

# List available skills from the registry
npx ralphy-skills list --registry

# Interactive management
npx ralphy-skills manage

# Remove a skill
npx ralphy-skills remove <skill-id>
```

### Search and Update

```bash
# Search for skills
npx ralphy-skills search react

# Update all installed skills
npx ralphy-skills update
```

## Related

- [Ralphy.sh VS Code Extension](https://marketplace.visualstudio.com/items?itemName=Ralphysh.ralphy-sh) - GUI-based skill management

## License

MIT
