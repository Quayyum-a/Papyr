# Git Workflow: Branching Strategy & PR Process

## Overview
This document establishes a Git workflow to ensure code quality, prevent bugs in production, and maintain a clean project history.

## Branch Strategy: Git Flow

### Branch Types

#### 1. **Main Branch** (`main`)
- **Purpose**: Production-ready code
- **Protection**: Requires PR review, all CI checks passing
- **Deploy**: Auto-deploys to production (`papyr-app-mu.vercel.app`)
- **Who can merge**: Tech Lead, DevOps Lead

#### 2. **Development Branch** (`develop`)
- **Purpose**: Integration branch for features
- **Deploy**: Auto-deploys to staging
- **Who can merge**: Team members after PR review

#### 3. **Feature Branches** (`feature/feature-name`)
- **Naming**: `feature/sprint-1-toolbar`, `feature/pen-tool`, etc.
- **From**: Branch from `develop`
- **Merge back to**: `develop` via PR
- **Lifetime**: Deleted after merge
- **Who creates**: Any team member

#### 4. **Bugfix Branches** (`bugfix/bug-description`)
- **Naming**: `bugfix/canvas-coordinate-fix`, `bugfix/undo-redo-crash`, etc.
- **From**: Branch from `develop`
- **Merge back to**: `develop` via PR
- **Lifetime**: Deleted after merge
- **Who creates**: Any team member

#### 5. **Hotfix Branches** (`hotfix/critical-issue`)
- **Naming**: `hotfix/drawing-not-working`, `hotfix/data-loss`
- **From**: Branch from `main` (production bug)
- **Merge back to**: `main` AND `develop` via PR
- **Lifetime**: Deleted after merge
- **Who creates**: Tech Lead only (critical bugs)

### Branch Naming Convention
```
<type>/<short-description>

Types:
- feature/     : New feature or enhancement
- bugfix/      : Bug fix for non-production issues
- hotfix/      : Critical production bug fix
- chore/       : Refactoring, documentation, cleanup
- test/        : Test improvements

Examples:
✓ feature/sprint-1-toolbar
✓ bugfix/canvas-resize-issue
✓ hotfix/drawing-crash
✓ chore/update-dependencies
✗ new-feature (too vague)
✗ fix_bug (wrong separator)
```

## PR (Pull Request) Process

### Before Creating a PR

1. **Create feature branch** from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make commits** with clear messages:
   ```bash
   git commit -m "Add toolbar component with tool selection"
   git commit -m "Implement pen and eraser tools"
   git commit -m "Add tool switching tests"
   ```

3. **Keep branch updated**:
   ```bash
   git fetch origin
   git rebase origin/develop
   ```

4. **Run tests locally**:
   ```bash
   npm run test          # Unit tests
   npm run build         # Build check
   npm run lint          # Linting
   ```

### Creating a PR

1. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub** with:
   - **Title**: Clear, descriptive (e.g., "Add toolbar with pen/eraser tools")
   - **Description**: Include:
     - What does this PR do?
     - Related issue/sprint
     - How to test it?
     - Screenshots/videos if UI changes
     - Any breaking changes?
   - **Target branch**: `develop` (or `main` for hotfixes)
   - **Link issues**: Use "Closes #123" or "Related to #456"

### PR Template
```markdown
## Description
Brief description of the changes made.

## Related Issues
Closes #123
Related to Sprint 1

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Performance improvement
- [ ] Documentation update

## How to Test
1. Check out this branch
2. Run `npm install && npm run dev`
3. Try [specific action]
4. Verify [expected result]

## Screenshots/Videos
[Add if applicable]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Tested locally
```

### PR Review Process

#### Reviewer Responsibilities
1. **Code Quality**:
   - Clear, maintainable code
   - No obvious bugs
   - Proper error handling
   - Performance considerations

2. **Testing**:
   - Unit tests cover new code
   - Integration tests for features
   - Edge cases considered

3. **Documentation**:
   - Code comments where needed
   - README/docs updated
   - Breaking changes documented

4. **Feedback**:
   - Use "Request Changes" for blocking issues
   - Use "Comment" for suggestions
   - Use "Approve" when satisfied

#### Author Responsibilities
1. **Respond to feedback** within 24 hours
2. **Make requested changes** in separate commits (don't squash)
3. **Request re-review** after changes
4. **Keep PR focused** - don't add unrelated changes

### Merging a PR

#### Conditions for Merge
- ✅ All CI checks passing (build, lint, tests)
- ✅ At least 1 approval from code reviewer
- ✅ No merge conflicts
- ✅ Branch is up-to-date with target branch
- ✅ All conversations resolved

#### Merge Process
1. **Use "Squash and merge"** for cleaner history:
   ```
   PR #42: Add toolbar with pen/eraser tools
   ```
   Instead of 5 individual commits

2. **Delete branch** after merge (GitHub option)

3. **Verify deployment**:
   - Staging: Check `papyr-staging.vercel.app`
   - Production: Approved by tech lead before deploy to main

## CI/CD Pipeline

### Automated Checks on Every PR
- **Build**: `npm run build` - Must succeed
- **Linting**: `next lint` - No errors
- **Type Check**: TypeScript compilation
- **Tests**: `npm run test` - All passing
- **Coverage**: Minimum 80% on new code

### Status Checks (Required before merge)
```
✓ Build passing
✓ Tests passing  
✓ Linting passing
✓ Type checking passing
```

## Commit Message Guidelines

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `test`: Test improvements
- `docs`: Documentation
- `refactor`: Code refactoring
- `style`: Code style changes
- `chore`: Build, dependencies, etc.

### Examples
```
✓ feat(toolbar): add pen and eraser tool selection
✓ fix(canvas): correct pointer coordinate calculation
✓ test(drawing): add unit tests for tool switching
✓ docs: update sprint 1 requirements
✗ fixed bug (too vague, wrong type)
✗ WIP (incomplete)
```

## Workflow Summary

### For a New Feature (Sprint 1)
```
1. Create feature branch:
   git checkout -b feature/sprint-1-toolbar develop

2. Make changes and commit:
   git commit -m "feat(toolbar): implement toolbar UI"
   git commit -m "feat(tools): add pen and eraser tools"

3. Push and create PR:
   git push origin feature/sprint-1-toolbar
   → Create PR on GitHub (target: develop)

4. Wait for review and approval:
   → Address feedback if needed
   → Reviewer approves

5. Merge when ready:
   → Use "Squash and merge"
   → Delete branch

6. Verify on staging:
   → Test on papyr-staging.vercel.app

7. Production deployment:
   → Create PR from develop → main
   → Tech lead approves
   → Deploy to papyr-app-mu.vercel.app
```

## Branch Protection Rules

### On `main` branch
- Require pull request reviews (min 1 approval)
- Require status checks passing
- Require branches to be up-to-date before merge
- Require code review before merge
- Dismiss stale PR approvals when new commits pushed
- Allow force pushes: NO

### On `develop` branch
- Require pull request reviews (min 1 approval)
- Require status checks passing
- Allow auto-merge: YES (squash)

## Rollback Procedures

### If a feature breaks production
1. Identify the problematic PR
2. Create hotfix branch from `main`:
   ```bash
   git checkout -b hotfix/fix-issue main
   ```
3. Fix the issue
4. Create PR to `main` (express review)
5. Merge after approval
6. Also merge fix into `develop`:
   ```bash
   git checkout develop
   git merge hotfix/fix-issue
   ```
7. Delete hotfix branch

## Tools & Automation

- **GitHub Actions**: Automated tests and build checks
- **Vercel**: Automatic preview deployments on every PR
- **Snyk**: Automated dependency vulnerability scanning
- **CodeQL**: GitHub's code security analysis

## FAQ

**Q: Can I push directly to main?**
A: No, main is protected. Always use feature branches and PRs.

**Q: How long should a feature branch live?**
A: Aim for 2-3 days. Longer branches = more merge conflicts.

**Q: What if my PR gets stale?**
A: Rebase on develop: `git rebase origin/develop` and force push.

**Q: Who can merge to main?**
A: Only Tech Lead or DevOps Lead after review.

**Q: How often do we merge develop → main?**
A: At end of each sprint (weekly) or for hotfixes.
