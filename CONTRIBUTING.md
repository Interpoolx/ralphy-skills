# Contributing to Ralphy-Skills

Thank you for your interest in contributing! We welcome contributions in all forms: skills, features, bug fixes, and documentation.

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Code Standards](#code-standards)
- [Skill Creation](#skill-creation)
- [Pull Request Process](#pull-request-process)
- [Community Guidelines](#community-guidelines)

---

## Ways to Contribute

### 1. Create & Submit a Skill

The easiest way to contribute! Share skills for:
- Development frameworks (React, Vue, Node.js, etc.)
- DevOps & deployment
- Workflow automation
- Tool integration
- Learning guides

**See**: [Creating Skills Guide](docs/CREATING_SKILLS.md)

### 2. Report Bugs

Found an issue? Help us fix it:

```bash
# Create an issue with:
- Clear title describing the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (Node version, OS, agent)
```

[Report Bug](https://github.com/Interpoolx/ralphy-skills/issues/new?labels=bug)

### 3. Request Features

Have an idea? Let us know:

```
Feature Request:
- Clear description of what you want
- Why it's useful
- How it would work
- Example usage
```

[Request Feature](https://github.com/Interpoolx/ralphy-skills/issues/new?labels=feature)

### 4. Improve Documentation

Documentation is always a work in progress:
- Fix typos
- Add examples
- Clarify instructions
- Update outdated content
- Translate to other languages

### 5. Help Others

- Answer questions in discussions
- Help debug issues
- Review pull requests
- Test new features

---

## Getting Started

### Fork & Clone

```bash
# 1. Fork on GitHub
# Visit: https://github.com/Interpoolx/ralphy-skills

# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/ralphy-skills.git
cd ralphy-skills

# 3. Add upstream remote
git remote add upstream https://github.com/Interpoolx/ralphy-skills.git

# 4. Create a feature branch
git checkout -b feature/your-feature-name
```

### Set Up Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests (when available)
npm test

# Try the CLI
node dist/index.js --help
```

### Make Changes

```bash
# Edit files
nano src/commands/your-command.ts

# Rebuild
npm run build

# Test your changes
node dist/index.js your-command --test
```

---

## Code Standards

### TypeScript

All code must be TypeScript with strict type checking:

```typescript
// ✅ GOOD: Clear types
async function installSkill(source: string, options: InstallOptions): Promise<void> {
  // Implementation
}

// ❌ BAD: Implicit any
async function installSkill(source: any, options: any): Promise<any> {
  // Implementation
}
```

**Style Guide**:
- Use const/let (no var)
- No implicit any types
- Use interfaces for object types
- 2-space indentation
- Semicolons required
- Quote marks: double quotes

### File Organization

```
src/
├── commands/          # CLI commands
│   ├── install.ts
│   ├── list.ts
│   └── ...
├── utils/             # Shared utilities
│   ├── git.ts
│   ├── validate.ts
│   └── ...
├── types/             # Type definitions
│   └── skill.ts
└── index.ts           # Main entry point
```

### Function Size

- Keep functions under 50 lines
- One responsibility per function
- Use descriptive names
- Add JSDoc comments for public functions

```typescript
/**
 * Install a skill from source
 * @param source - GitHub URL or local path
 * @param options - Installation options
 * @returns Promise that resolves when skill is installed
 */
export async function installSkill(
  source: string,
  options: InstallOptions
): Promise<void> {
  // Implementation
}
```

### Error Handling

```typescript
// ✅ GOOD: Specific error handling
try {
  await validateSkill(skillPath);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Validation failed: ${error.message}`);
  } else {
    throw error;
  }
}

// ❌ BAD: Generic error handling
try {
  await validateSkill(skillPath);
} catch (error) {
  console.error("Error");
}
```

### Dependencies

Only add dependencies if necessary:
- Keep bundle small
- Prefer standard library
- Get approval before adding
- Use as few as possible

Current dependencies:
- `chalk` - Terminal colors
- `commander` - CLI framework
- `gray-matter` - YAML parsing

---

## Skill Creation

### Submission Checklist

Before submitting a skill:

- [ ] SKILL.md created with valid frontmatter
- [ ] marketplace.json with metadata
- [ ] Tested on at least 2 agents
- [ ] All code examples work
- [ ] Validated with `npx ralphy-skills validate`
- [ ] No console.log or debugging code
- [ ] No sensitive information
- [ ] Follows naming conventions
- [ ] Semantic versioning in place

### Skill Quality Standards

**Documentation**:
- Clear purpose statement
- Well-organized sections
- Real examples
- Troubleshooting guide
- Resource links

**Code**:
- Tested and working
- Error handling included
- Clear comments
- No external dependencies (if possible)

**Compatibility**:
- Works on listed agents
- Cross-platform (macOS, Linux, Windows)
- No OS-specific assumptions
- Compatible with Node versions listed

### Skill Submission Process

```bash
# 1. Create skill
npx ralphy-skills create my-skill

# 2. Develop & test
# ... edit SKILL.md & marketplace.json ...

# 3. Validate
npx ralphy-skills validate ./my-skill

# 4. Test locally
npx ralphy-skills install ./my-skill

# 5. Submit
npx ralphy-skills submit ./my-skill
```

---

## Pull Request Process

### Before Creating PR

1. **Sync with upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Test your changes**:
   ```bash
   npm run build
   npm test  # When available
   ```

3. **Follow code standards**:
   - No linting errors
   - Clear commit messages
   - Meaningful variable names
   - Comments for complex logic

### Creating PR

1. **Push to your fork**:
   ```bash
   git push origin feature/your-feature
   ```

2. **Create PR on GitHub**:
   - Clear title: "feat: add feature description"
   - Description explaining changes
   - Screenshots if UI changes
   - Link related issues

3. **PR Template** (for reference):
   ```markdown
   ## Description
   What changes does this PR make?

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Documentation
   - [ ] Breaking change

   ## Testing
   How to test these changes?

   ## Screenshots
   If applicable, add screenshots

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for clarity
   - [ ] No new console.log/debugging
   - [ ] Tests pass (if applicable)
   ```

### Review Process

- **Automated checks**: Code must pass type checking
- **Review by maintainer**: At least one approval
- **Address feedback**: Make requested changes
- **Squash commits**: Keep history clean (optional)
- **Merge**: Once approved

### Commit Messages

Use conventional commits:

```
feat: add new feature
fix: resolve bug issue
docs: update documentation
refactor: improve code quality
test: add test coverage
chore: update dependencies
```

Example:
```
feat(install): add private Git repo support

Allow installing skills from private GitHub repositories
using SSH keys and personal access tokens.

- Support SSH key authentication
- Support GitHub token authentication
- Add --credentials flag
- Add config file support

Closes #123
```

---

## Community Guidelines

### Be Respectful

- Use inclusive language
- Respect different opinions
- Assume good intentions
- Welcome diverse perspectives
- No harassment, discrimination, or hate speech

### Be Helpful

- Answer questions patiently
- Provide clear explanations
- Link to relevant docs
- Share knowledge freely
- Help newer contributors

### Be Constructive

- Offer solutions, not just criticism
- Explain the "why" behind suggestions
- Suggest improvements kindly
- Ask clarifying questions
- Appreciate the effort

### Report Issues Responsibly

For security issues:
- Don't create public issues
- Email: security@ralphy.sh
- Include reproduction steps
- Allow time to fix before disclosure

---

## Development Tips

### Useful Commands

```bash
# Format code
npm run format

# Type check
npm run typecheck

# Build
npm run build

# Watch mode
npm run dev
```

### Local Testing

```bash
# Test commands
node dist/index.js install ./test-skill

# Test with different agents
# Test on: Claude Code, Cursor, Windsurf, Aider

# Test on different OSes
# macOS, Linux, Windows
```

### Debugging

```bash
# Enable verbose logging
DEBUG=* node dist/index.js install ./skill

# Use VS Code debugger
# Add breakpoints and run with debug config
```

---

## Questions?

- **GitHub Issues**: [Ask a question](https://github.com/Interpoolx/ralphy-skills/issues/new)
- **Discussions**: [Community chat](https://github.com/Interpoolx/ralphy-skills/discussions)
- **Email**: hello@ralphy.sh

---

## Recognition

Contributors are recognized in:
- README.md
- GitHub contributors page
- Release notes
- Community shoutouts

Thank you for making Ralphy-Skills better! 💜

---

**Code of Conduct**: This project is committed to providing a welcoming and inclusive environment. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

By contributing, you agree to license your contributions under the same license as the project (MIT).
