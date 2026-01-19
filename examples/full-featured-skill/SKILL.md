---
name: git-workflow
description: Complete Git workflow best practices for team collaboration and CI/CD
version: 1.0.0
keywords: [git, workflow, collaboration, devops]
author:
  name: Ralphy Team
  github: Interpoolx
category: workflow
compatible_agents: [claude-code, cursor, windsurf, aider]
requirements: [git>=2.0.0, nodejs>=16]
---

# Git Workflow Mastery

A comprehensive skill for managing Git workflows in team environments with CI/CD integration.

## Purpose

This skill guides you through:
- Professional Git branching strategies (Git Flow, GitHub Flow)
- Commit conventions (Conventional Commits)
- Pull request best practices
- Team collaboration patterns
- CI/CD integration
- Troubleshooting common issues

## When to Use

Load this skill when:
- Setting up a new project workflow
- Training team members on Git best practices
- Implementing CI/CD pipelines
- Troubleshooting merge conflicts
- Establishing commit conventions

## Quick Start

### 1. Initialize Your Project Workflow

```bash
# Create main development branches
git checkout -b develop
git push -u origin develop

# Set default branch to main in GitHub
# (Settings → Branches → Default branch)
```

### 2. Create Feature Branches

```bash
# Feature branch naming: feature/brief-description
git checkout -b feature/user-authentication

# Do your work...
git add .
git commit -m "feat: implement JWT authentication"

# Push and create PR
git push -u origin feature/user-authentication
```

### 3. Write Conventional Commits

```bash
git commit -m "feat: add password reset functionality"
git commit -m "fix: resolve race condition in cache"
git commit -m "docs: update API documentation"
git commit -m "refactor: simplify data validation logic"
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

### 4. Create & Review Pull Requests

```bash
# After pushing, create PR on GitHub
# Include:
# - Clear title describing the change
# - Description with context
# - Checklist of changes
# - Screenshots if UI changes
# - Link to related issues
```

### 5. Merge & Deploy

```bash
# Merge PR (use "Squash and merge" for cleaner history)
# This automatically closes linked issues

# Delete remote branch
git push origin -d feature/user-authentication

# Update local
git checkout main
git pull origin main
```

## Branching Strategies

### GitHub Flow (Recommended for Most Teams)

Simple and effective:
```
main (production)
  ↑
  ├─ feature/feature-1
  ├─ feature/feature-2
  └─ hotfix/critical-bug
```

**Workflow**:
1. Create feature branch from `main`
2. Make commits
3. Open PR for review
4. Merge to `main` (auto-deploys)
5. Delete branch

### Git Flow (For Complex Projects)

More structure with staging:
```
main (production)
  ↑
develop (staging)
  ↑
  ├─ feature/feature-1
  ├─ release/v1.0
  └─ hotfix/critical-bug
```

**Workflow**:
1. Create feature from `develop`
2. Finish feature → merge back to `develop`
3. Release branch for testing
4. Merge to `main` (production)
5. Tag release

## Commit Message Standards

### Conventional Commits Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Examples

**Feature**:
```
feat(auth): implement OAuth2 authentication

Add OAuth2 provider support with callback handling.
- Support GitHub and Google providers
- Automatic token refresh
- Secure credential storage

Closes #123
```

**Bug Fix**:
```
fix(api): prevent race condition in concurrent requests

Use mutex lock to prevent simultaneous cache updates.
Previously, rapid concurrent requests would create duplicate
entries in the database.

Fixes #456
```

**Refactoring**:
```
refactor(utils): simplify validation logic

Extract validation into separate module for reusability.
Reduces code duplication and improves testability.

Breaking change: validateEmail() now returns object instead of boolean
```

## Pull Request Checklist

Before submitting a PR:

- [ ] Branch is up-to-date with `main`
- [ ] All tests pass locally
- [ ] Code follows project style guide
- [ ] Commit messages are clear and conventional
- [ ] PR description explains the changes
- [ ] Related issues are linked
- [ ] No debugging code or console logs
- [ ] Screenshots/videos if UI changes

## Team Collaboration Tips

### Code Review Process

1. **Author**: Create PR with clear description
2. **Reviewers**: Check logic, tests, style
3. **Comments**: Use "Request changes" if critical issues
4. **Author**: Address feedback and push updates
5. **Reviewer**: Approve when satisfied
6. **Merge**: Use "Squash and merge" for clean history

### Handling Feedback

```bash
# After feedback, make changes
git add .
git commit -m "refactor: address review feedback"
git push

# Don't force push - let reviewers see the conversation
# Only force push if reviewer approves
```

### Merging & Cleanup

```bash
# GitHub automatically merges after approval
# Then delete the branch:
git remote update origin --prune
git branch -D feature/old-feature
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: CI/CD
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test
      - run: npm run lint
```

### Deployment Strategy

1. **On PR**: Run tests and linting
2. **On Merge to Main**: Deploy to production
3. **On Release Tag**: Create GitHub Release

## Troubleshooting

### Merge Conflicts

```bash
# Get the latest from main
git fetch origin
git rebase origin/main

# Resolve conflicts in your editor
# Then continue
git add .
git rebase --continue
git push -f origin feature/branch
```

### Accidental Commit

```bash
# If you committed to wrong branch:
git reset --soft HEAD~1    # Undo last commit, keep changes
git stash                  # Save changes
git checkout main          # Switch to correct branch
git stash pop              # Apply changes
git commit -m "..."        # Re-commit
```

### Sync Fork with Upstream

```bash
# Add upstream remote
git remote add upstream https://github.com/original/repo.git

# Fetch and merge
git fetch upstream
git merge upstream/main
git push origin main
```

## Resources

For more details, see:
- `references/git-commands.md` — Common Git commands
- `references/troubleshooting.md` — Problem solving
- `scripts/setup-workflow.sh` — Automated setup
- `assets/pr-template.md` — PR template

## Best Practices Summary

✅ **Do**:
- Create feature branches for all changes
- Use conventional commits
- Keep PRs focused (one feature per PR)
- Review before merging
- Use meaningful commit messages
- Tag releases
- Keep history clean

❌ **Don't**:
- Commit directly to main
- Mix multiple features in one PR
- Write vague commit messages ("fix stuff")
- Force push to shared branches
- Merge your own PRs without review
- Forget to update documentation

---

**Ready to master Git?** Start with the Quick Start section and gradually adopt more advanced patterns as your team grows!
