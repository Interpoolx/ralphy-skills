# Changelog

All notable changes to ralphy-skills will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-01-19

### 🎉 Major Features Added

#### 🌐 Web-Based Skills Browser
- **NEW COMMAND:** `ralphy-skills serve` - Start local web server for browsing skills
- Beautiful, responsive web interface with gradient design
- Real-time search functionality with category filtering
- Statistics dashboard showing installed skills, registry total, and categories
- Category-based skill filtering with visual tags
- Mobile-friendly, responsive design
- REST API endpoints for programmatic access

#### 🔧 Skill Creation Tools
- **NEW COMMAND:** `ralphy-skills create [name]` - Scaffold new skills interactively
- Interactive CLI prompts for skill metadata (name, description, category, tags, author)
- Auto-generates properly formatted `SKILL.md` with YAML frontmatter
- Creates `marketplace.json` with all required fields
- Generates `README.md` with installation instructions
- Optional directories: `examples/`, `references/`, `tests/`
- Auto-detects Git user name and email for author info
- Creates `.gitignore` automatically

#### ✅ Validation System
- **NEW COMMAND:** `ralphy-skills validate [path]` - Validate skill format and quality
- Quality score system (0-100) based on completeness
- Validates SKILL.md frontmatter and content
- Checks marketplace.json structure
- Verifies directory structure and recommended files
- Content quality analysis (code examples, links, TODOs)
- Strict mode option for CI/CD pipelines
- Detailed error and warning messages
- Auto-fix suggestions

#### 📊 REST API Server
- Full REST API when running `serve` command
- `GET /api/skills` - List all installed skills
- `GET /api/skills/:id` - Get specific skill details
- `GET /api/registry` - List registry skills
- `GET /api/search?q=query&category=cat` - Search skills
- `GET /api/stats` - Get statistics (counts, categories)
- CORS enabled for frontend integrations
- JSON responses for programmatic access

### ✨ Enhancements

#### Package & Distribution
- Updated package version to 2.0.0 (major release)
- Enhanced package.json with comprehensive metadata
- Added repository, homepage, and bugs URLs
- Improved keywords for better npm search discoverability
- Added `types` export for TypeScript users
- Added `prepublishOnly` script for build automation
- Added `serve` npm script for easy web server start
- Updated `files` array to include marketplace.json

#### Documentation
- Created comprehensive README_V2.md with all new features
- Added NPM_PUBLISHING_GUIDE.md for maintainers
- Created CHANGELOG.md (this file)
- Added feature comparison tables
- Documented all CLI commands with examples
- Added API endpoint documentation

#### Developer Experience
- Better TypeScript types and interfaces
- Improved error messages and user feedback
- Enhanced CLI help text
- Added success indicators and visual feedback

### 🔧 Technical Changes

#### New Files
- `src/commands/create.ts` - Skill scaffolding logic
- `src/commands/validate.ts` - Validation system
- `src/server/api.ts` - Web server and API
- `README_V2.md` - New comprehensive README
- `NPM_PUBLISHING_GUIDE.md` - Publishing instructions
- `CHANGELOG.md` - This changelog

#### Updated Files
- `src/index.ts` - Added create, validate, serve commands
- `package.json` - Version bump, metadata, scripts
- Enhanced CLI with new command options

### 📦 Dependencies
No new runtime dependencies added (kept lightweight)

### 🚀 Performance
- Web server with efficient HTTP handling
- Cached skill metadata for faster API responses
- Optimized search with real-time filtering

### 🔒 Security
- CORS enabled but configurable
- No sensitive data exposed in API
- Secure file path handling

### 📱 Compatibility
- Node.js >=16.0.0 (unchanged)
- Works with all AI coding assistants
- Backward compatible with v1.x commands

---

## [1.1.0] - 2024-01-XX

### Features

#### Interactive TUI Management
- Enhanced `manage` command with full terminal UI
- Multi-select for bulk operations
- Visual progress indicators
- Bulk removal with confirmation
- Skill export functionality

#### Private Repository Support
- GitHub Personal Access Token support
- SSH key authentication
- Username/password authentication
- Automatic credential detection
- Environment variable support (GITHUB_TOKEN)
- `--private`, `--token`, `--ssh-key` flags

#### CI/CD Automation
- `--yes/-y` flags on all commands to skip prompts
- JSON output formats for scripting
- Proper exit codes for automation
- `--dry-run` mode for testing changes
- Batch operations support

#### Multi-Format Output
- JSON export with metadata
- YAML for DevOps integration
- CSV for spreadsheet analysis
- Markdown (existing format)
- `--format` flag on sync command

#### Enhanced Search
- Filter by category, tags, source
- Sort by relevance, popularity, date
- Export search results (JSON/CSV)
- Combined registry + installed search
- `--export` flag to save results

#### Multi-Skill Operations
- Comma-separated multi-read: `read skill1,skill2,skill3`
- Bulk install operations
- Parallel skill processing

### Enhancements
- Added inquirer dependency for interactive prompts
- New `git-auth.ts` utility for private repos
- Enhanced all command files with new options

---

## [1.0.0] - 2024-XX-XX

### Initial Release

#### Core Commands
- `install` - Install skills from registry, GitHub, or local
- `list` - List installed and registry skills
- `read` - Read skill content for AI agents
- `remove` - Remove specific skills
- `update` - Update installed skills
- `sync` - Generate AGENTS.md for AI agents
- `search` - Search for skills

#### Features
- Registry system with remote/cache/bundled fallback
- Multiple installation locations (.agent, .claude, global)
- Symlink support for local development
- GitHub URL parsing and skill download
- SKILL.md with YAML frontmatter parsing
- marketplace.json support

#### AI Agent Support
- Claude Code
- Cursor
- Windsurf
- Aider
- VS Code + Copilot
- Any AI coding assistant

---

## Release Notes

### What's Next (v2.1 Roadmap)
- [ ] Skill ratings & reviews system
- [ ] Analytics dashboard
- [ ] Automated testing suite
- [ ] Skill dependencies resolution
- [ ] Version management improvements
- [ ] Community marketplace website
- [ ] GitHub Actions integration
- [ ] VS Code extension sync

---

## Migration Guide

### Upgrading from v1.x to v2.0

**Breaking Changes:** None! v2.0 is fully backward compatible.

**New Features to Try:**
```bash
# Try the web browser
npx ralphy-skills serve

# Create a new skill
npx ralphy-skills create my-skill

# Validate existing skills
npx ralphy-skills validate ./my-skill
```

All existing commands work exactly as before!

---

## Links

- 📦 **NPM:** https://www.npmjs.com/package/ralphy-skills
- 💻 **GitHub:** https://github.com/Interpoolx/ralphy-skills
- 📚 **Docs:** https://github.com/Interpoolx/ralphy-skills#readme
- 🐛 **Issues:** https://github.com/Interpoolx/ralphy-skills/issues
