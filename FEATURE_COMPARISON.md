# Ralphy-Skills vs OpenSkills - Feature Comparison

## Overview

| Aspect | Ralphy-Skills | OpenSkills |
|--------|---------------|-----------|
| **Repository** | github.com/Interpoolx/ralphy-skills | github.com/numman-ali/openskills |
| **Stars** | New (recently pushed) | 5.9k ⭐ |
| **Version** | 1.1.0 | 1.5.0 |
| **License** | MIT | Apache 2.0 |
| **Language** | TypeScript | TypeScript (96.9%) |
| **Node Version** | >=16.0.0 | >=20.6+ |

---

## Commands Comparison

### Ralphy-Skills Commands (6 total)
1. ✅ **install** - Install a skill from registry, GitHub, or local folder
2. ✅ **list** - List installed skills (with --registry flag for available skills)
3. ✅ **read** - Load skill content on demand (for agents)
4. ✅ **remove** - Remove an installed skill
5. ✅ **update** - Update all or specific installed skills
6. ✅ **sync** - Generate AGENTS.md with available skills menu

### OpenSkills Commands (7 total)
1. ✅ **install** - Install from GitHub, local path, or private repo
2. ✅ **sync** - Update AGENTS.md (with custom output path support: `-o <path>`)
3. ✅ **list** - Show installed skills
4. ✅ **read** - Load skill (for agents) - supports comma-separated multiple reads
5. ✅ **update** - Update installed skills (default: all, or specific)
6. ✅ **manage** - Remove skills (interactive menu) ⭐ **NOT IN RALPHY**
7. ✅ **remove** - Remove specific skill

---

## Feature Comparison

### Installation Options

| Feature | Ralphy-Skills | OpenSkills |
|---------|---------------|-----------|
| Install from registry | ✅ | ✅ (Anthropic marketplace) |
| Install from GitHub URL | ✅ | ✅ |
| Install from local path | ✅ | ✅ |
| Install from private Git repos | ❌ | ✅ **MISSING** |
| Symlink support (dev mode) | ✅ | ✅ |
| Global installation | ✅ (`--global`) | ✅ (`--global`) |
| Universal mode (`.agent/skills`) | ✅ (`--universal`) | ✅ (`--universal`) |
| Skip prompts flag | ❌ | ✅ (`-y, --yes`) **MISSING** |
| Custom output path | ❌ | ✅ (`-o <path>`) **MISSING** |

### Installation Paths & Priority

#### Ralphy-Skills
- `.claude/skills/` (default, project-local)
- `.agent/skills/` (with `--universal` flag)
- `~/.ralphy/skills` (with `--global` flag)

#### OpenSkills
- `.claude/skills/` (default, project-local)
- `.agent/skills/` (with `--universal` flag)
- `~/.claude/skills` (with `--global` flag)

**Priority Order (OpenSkills)**:
1. `./.agent/skills/` (highest)
2. `~/.agent/skills/`
3. `./.claude/skills/`
4. `~/.claude/skills/` (lowest)

---

## Skill Management Features

### Ralphy-Skills
- ✅ List installed skills
- ✅ List registry skills
- ✅ Remove skills
- ✅ Update skills
- ❌ Interactive management UI

### OpenSkills
- ✅ List installed skills
- ✅ Remove skills (specific)
- ✅ **Interactive remove menu** (manage command) - **MISSING IN RALPHY**
- ✅ Update skills (with selective updates)
- ✅ Update multiple comma-separated skills

---

## Available Skills

### Ralphy-Skills (in recommended_skills.json)
**6 Skills Currently Registered:**
1. vercel-react-best-practices
2. convex-avoid-feature-creep
3. expo-app-design
4. cloudflare-agents-sdk
5. cloudflare-mcp-server
6. antigravity-kit

**Installed Skills:**
- 1 local skill (test-skill)

### OpenSkills (from Anthropic Marketplace)
- **Direct access to Anthropic's entire skills registry** via `anthropics/skills`
- Estimated 20+ official skills available
- Can install from any GitHub repository
- Open ecosystem - no curated limit

---

## Key Differences

### 1. **Registry & Marketplace Integration**
- **Ralphy**: Maintains its own `recommended_skills.json` with 6 curated skills
- **OpenSkills**: Directly integrates with Anthropic's official skills marketplace (hundreds available)

### 2. **Unique Ralphy Features**
- Search command: `npx ralphy-skills search <query>` ❌ (NOT in OpenSkills)
- Custom registry location at `~/.ralphy/skills` instead of Claude standard

### 3. **Unique OpenSkills Features**
- **Interactive manage command**: Browse and remove skills with menu UI
- **Private Git repos support**: `git@github.com:org/private-skills.git`
- **Custom output paths**: `npx openskills sync -o custom-path.md`
- **CI-friendly**: `-y, --yes` flag to skip prompts
- **Comma-separated multi-read**: `npx openskills read foo,bar,baz`
- **Exact Anthropic compatibility**: Uses `.claude/skills` standard by default

### 4. **Code Quality & Maturity**
- **OpenSkills**: 5.9k GitHub stars, 47 commits, 9 released versions, active maintenance
- **Ralphy**: Recently initialized, smaller community but fresh codebase

---

## What Ralphy-Skills is Missing

### High Priority Features (from OpenSkills)
1. ✋ **Interactive skill management menu** (`manage` command)
2. 🔐 **Private Git repository support** (SSH, GitHub tokens)
3. 🤐 **CI/CD automation** (`-y, --yes` non-interactive flag)
4. 🎯 **Custom output paths** for sync command
5. 📦 **Access to Anthropic's full skills marketplace** (currently limited to 6 in JSON)

### Medium Priority Features
1. 💪 **Comma-separated multi-read** for loading multiple skills at once
2. 📚 **Better search capabilities** (already has search, but could be enhanced)
3. 🔄 **Pre-update tracking** for skills installed before tracking was added

### Low Priority (Nice-to-Have)
1. Documentation on skill authoring (OpenSkills has "skill-creator" helper skill)
2. Security policy documentation
3. Contributing guidelines

---

## Recommendations for Ralphy-Skills

### To Compete with OpenSkills:
1. **Expand registry integration** - Connect to or cache the Anthropic marketplace
2. **Add interactive management** - Implement a TUI or menu-based skill browser
3. **Support private repos** - Add SSH and token-based GitHub authentication
4. **Add CI flags** - Implement `--yes/-y` for non-interactive mode
5. **Custom output paths** - Allow `--output` flag in sync command

### To Differentiate Ralphy:
1. Keep the `search` command (OpenSkills doesn't have this)
2. Maintain simpler registry approach if targeting beginners
3. Add VS Code Extension (Ralphysh.ralphy-sh already exists)
4. Consider creating your own skill ecosystem/marketplace

---

## Compatibility Notes

- **Both follow Anthropic's SKILL.md format** ✅
- **Both support `.agent/skills` for universal agents** ✅
- **Both use `AGENTS.md` for skill management** ✅
- **OpenSkills is more feature-complete** for enterprise use cases
- **Ralphy-Skills is simpler** for getting started

---

## Installation Comparison

```bash
# Ralphy-Skills
npx ralphy-skills install vercel-react-best-practices
npx ralphy-skills install ./my-custom-skill --symlink
npx ralphy-skills list
npx ralphy-skills sync

# OpenSkills
npx openskills install anthropics/skills
npx openskills install ./my-skill
npx openskills list
npx openskills sync -y -o AGENTS.md
```

---

## Score Card

| Category | Ralphy | OpenSkills | Winner |
|----------|--------|-----------|--------|
| **Commands** | 6 | 7 | OpenSkills |
| **Installation Options** | 4/7 | 7/7 | OpenSkills |
| **Registry Access** | Limited (6) | Unlimited (Anthropic) | OpenSkills |
| **Interactive UI** | ❌ | ✅ | OpenSkills |
| **CI/CD Support** | ❌ | ✅ | OpenSkills |
| **Private Repos** | ❌ | ✅ | OpenSkills |
| **Search** | ✅ | ❌ | Ralphy |
| **VS Code Extension** | ✅ | ❌ | Ralphy |
| **Maturity** | New | Established | OpenSkills |
| **Community** | Growing | 5.9k+ | OpenSkills |

**Overall: OpenSkills is 70% feature-complete compared to where Ralphy should be**
