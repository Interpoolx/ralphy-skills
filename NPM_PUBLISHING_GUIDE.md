# 📦 NPM Publishing Guide for Ralphy Skills v2.0

## 🎯 Pre-Publishing Checklist

### **1. Version & Documentation**
- [ ] Update version in `package.json` to `2.0.0`
- [ ] Update `README.md` with new features
- [ ] Create/Update `CHANGELOG.md`
- [ ] Update documentation in `docs/`
- [ ] Verify all links work

### **2. Code Quality**
- [ ] Run `npm run build` successfully
- [ ] Fix all TypeScript errors
- [ ] Test all commands manually
- [ ] Verify web server works: `npm run serve`
- [ ] Test on fresh install

### **3. Package Configuration**
- [ ] Verify `package.json` metadata (author, homepage, repository, bugs)
- [ ] Check `files` array includes all necessary files
- [ ] Verify `keywords` for npm search
- [ ] Check `bin` entry points work
- [ ] Verify `engines.node` requirement

### **4. Legal & Licensing**
- [ ] Add/Update `LICENSE` file (MIT)
- [ ] Verify no proprietary code
- [ ] Check all dependencies are compatible licenses

---

## 🚀 Step-by-Step Publishing Process

### **Step 1: Prepare the Release**

```bash
# 1. Clean build
rm -rf dist node_modules package-lock.json
npm install
npm run build

# 2. Test the package locally
npm link
ralphy-skills --version
ralphy-skills list
ralphy-skills serve
npm unlink ralphy-skills

# 3. Test with npx (simulates real usage)
npx . list
npx . serve
```

### **Step 2: Version Management**

```bash
# Update version (choose one)
npm version patch   # 2.0.0 -> 2.0.1
npm version minor   # 2.0.0 -> 2.1.0
npm version major   # 2.0.0 -> 3.0.0

# Or manually edit package.json
# Current: 2.0.0 (major release with web interface)
```

### **Step 3: Create GitHub Release**

```bash
# Commit all changes
git add .
git commit -m "Release v2.0.0 - Web browser, skill creator, validation"

# Create git tag
git tag -a v2.0.0 -m "v2.0.0 - Major release with web interface"

# Push to GitHub
git push origin main
git push origin v2.0.0
```

### **Step 4: NPM Login & Publish**

```bash
# Login to npm (one-time setup)
npm login
# Enter username, password, email

# Verify you're logged in
npm whoami

# Dry run (see what will be published)
npm publish --dry-run

# Publish to npm!
npm publish

# For beta/pre-release versions:
# npm publish --tag beta
```

### **Step 5: Verify Publication**

```bash
# Check on npm
open https://www.npmjs.com/package/ralphy-skills

# Test installation globally
npm install -g ralphy-skills@2.0.0
ralphy-skills --version
ralphy-skills list
ralphy-skills serve

# Test with npx (most common usage)
npx ralphy-skills@2.0.0 list
npx ralphy-skills@2.0.0 serve
```

---

## 📝 Creating CHANGELOG.md

Create `CHANGELOG.md` in the root directory:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2024-XX-XX

### 🎉 Major Features Added

#### Web-Based Skills Browser
- New `serve` command to start local web server
- Beautiful, responsive web interface
- Real-time search and filtering
- Statistics dashboard
- Category-based browsing
- Mobile-friendly design

#### Skill Creation Tools
- New `create` command for scaffolding skills
- Interactive CLI prompts
- Automatic directory structure generation
- Template-based SKILL.md generation
- marketplace.json auto-generation

#### Validation System
- New `validate` command
- Quality score (0-100)
- Format checking
- Best practices compliance
- Strict mode option

#### REST API
- Full REST API when running `serve`
- GET /api/skills - List all skills
- GET /api/skills/:id - Get skill details
- GET /api/registry - Registry skills
- GET /api/search - Search endpoint
- GET /api/stats - Statistics

### ✨ Enhancements

- Updated package.json with better metadata
- Improved keywords for npm search
- Added repository, homepage, bugs URLs
- Enhanced README with comprehensive docs
- Better TypeScript types

### 🔧 Developer Experience

- Added `prepublishOnly` script
- Added `serve` npm script
- Better error messages
- Improved CLI output

### 📦 Package Changes

- Version bump to 2.0.0
- Added types export in package.json
- Updated files array to include marketplace.json
- Enhanced keywords for discoverability

## [1.1.0] - Previous Release

(Your existing v1.1.0 features)
- Interactive TUI management
- Private repo support
- CI/CD automation flags
- Multi-format export
- Advanced search

## [1.0.0] - Initial Release

- Basic skill installation
- List and search commands
- Registry support
```

---

## 🎯 NPM Package Optimization

### **package.json Best Practices**

```json
{
  "name": "ralphy-skills",
  "version": "2.0.0",
  "description": "Universal Skills Marketplace for AI Coding Agents. Browse, install, and manage AI agent skills with CLI and web interface.",
  "keywords": [
    "ai", "skills", "agent", "cursor", "vscode", "copilot",
    "claude", "windsurf", "aider", "marketplace", "cli",
    "web-browser", "skill-manager", "ai-tools", "developer-tools"
  ],
  "author": "Ralphysh <hello@ralphy.sh> (https://ralphy.sh)",
  "homepage": "https://github.com/Interpoolx/ralphy-skills#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Interpoolx/ralphy-skills.git"
  },
  "bugs": {
    "url": "https://github.com/Interpoolx/ralphy-skills/issues"
  }
}
```

### **What Gets Published**

Files included (from `files` array):
- ✅ `dist/` - Compiled JavaScript
- ✅ `data/` - Bundled data files
- ✅ `README.md` - Documentation
- ✅ `LICENSE` - MIT license
- ✅ `marketplace.json` - Registry data

Files excluded (automatically):
- ❌ `src/` - TypeScript source
- ❌ `node_modules/` - Dependencies
- ❌ `.git/` - Git history
- ❌ `*.ts` files
- ❌ Development files

---

## 📊 Post-Publication Monitoring

### **Track npm Statistics**

```bash
# View download stats
npm-stat ralphy-skills

# Or visit:
# https://npm-stat.com/charts.html?package=ralphy-skills
```

### **Monitor Package Health**

- 📦 **npm package page**: https://www.npmjs.com/package/ralphy-skills
- 📈 **Download stats**: npm-stat.com
- 🐛 **GitHub issues**: Track user feedback
- ⭐ **GitHub stars**: Community interest
- 💬 **Discussions**: User questions/feedback

---

## 🔄 Updating After Publication

### **Publishing Patches**

```bash
# Fix bugs, then:
npm version patch  # 2.0.0 -> 2.0.1
git push origin main --tags
npm publish
```

### **Publishing Minor Updates**

```bash
# Add features, then:
npm version minor  # 2.0.0 -> 2.1.0
git push origin main --tags
npm publish
```

### **Deprecating Old Versions**

```bash
# Deprecate old version
npm deprecate ralphy-skills@1.0.0 "Please upgrade to v2.0.0 for web interface"

# Unpublish within 72 hours (if needed)
npm unpublish ralphy-skills@2.0.0
```

---

## 🎯 Marketing & Promotion

### **After Publishing**

1. **Announce on Social Media**
   - Twitter/X: Share release notes
   - LinkedIn: Professional announcement
   - Dev.to: Write blog post
   - Reddit: Post in r/javascript, r/programming

2. **Update Documentation**
   - GitHub README badges
   - Add to awesome lists
   - Update website (if you have one)

3. **Community Engagement**
   - Share in Discord communities
   - Post on Hacker News
   - Submit to Product Hunt

4. **Write Content**
   - Blog post about v2.0 features
   - Tutorial video
   - Comparison with competitors

---

## ⚠️ Common Issues & Solutions

### **Issue: "You do not have permission to publish"**
```bash
# Solution: Login with correct account
npm logout
npm login
```

### **Issue: "Package name already exists"**
```bash
# Solution: Package name is taken, choose different name
# OR: You own it but not logged in - run npm login
```

### **Issue: "Missing LICENSE file"**
```bash
# Solution: Create MIT LICENSE file
echo "MIT License..." > LICENSE
```

### **Issue: "Package size too large"**
```bash
# Solution: Check what's being published
npm publish --dry-run

# Add to .npmignore:
# examples/
# docs/
# *.test.ts
```

---

## ✅ Final Pre-Publish Checklist

Before running `npm publish`:

- [ ] ✅ Build succeeds: `npm run build`
- [ ] ✅ All commands work
- [ ] ✅ Web server runs: `npm run serve`
- [ ] ✅ README.md is complete
- [ ] ✅ CHANGELOG.md updated
- [ ] ✅ LICENSE file exists
- [ ] ✅ package.json version updated
- [ ] ✅ Git committed and tagged
- [ ] ✅ Tested with `npm link`
- [ ] ✅ Dry run looks good: `npm publish --dry-run`
- [ ] ✅ Logged into npm: `npm whoami`

**Then:**
```bash
npm publish
```

---

## 🎉 Success!

Your package is now live on npm! 

**Next steps:**
1. Monitor downloads and issues
2. Respond to community feedback
3. Plan v2.1 features
4. Keep documentation updated

**Share the good news:**
```bash
echo "🚀 ralphy-skills v2.0.0 is live on npm!"
echo "Install: npm install -g ralphy-skills"
echo "Try: npx ralphy-skills serve"
```

---

## 📞 Need Help?

- 📚 [npm Documentation](https://docs.npmjs.com/cli/v8/commands/npm-publish)
- 💬 [npm Support](https://www.npmjs.com/support)
- 🐛 [Report Issues](https://github.com/Interpoolx/ralphy-skills/issues)
