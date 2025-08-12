# 🚀 GitHub Setup Guide for Team Collaboration

## 📋 Step-by-Step Setup

### 1. Create GitHub Repository

1. **Go to GitHub.com** and sign in
2. **Click "New repository"** (green button)
3. **Repository name**: `finance-tracker-app`
4. **Description**: `A comprehensive personal finance management app built with React Native, Expo, and Supabase`
5. **Visibility**: Choose based on your preference
   - **Public**: Anyone can see the code (good for portfolio)
   - **Private**: Only team members can see (good for business)
6. **Initialize with**: 
   - ✅ Add a README file
   - ✅ Add .gitignore (choose Node.js)
   - ✅ Choose a license (MIT recommended)
7. **Click "Create repository"**

### 2. Connect Your Local Repository

```bash
# Add the remote repository
git remote add origin https://github.com/YOUR_USERNAME/finance-tracker-app.git

# Push your code to GitHub
git branch -M main
git push -u origin main
```

### 3. Set Up Team Access

1. **Go to your repository** on GitHub
2. **Click "Settings"** tab
3. **Click "Collaborators"** in the left sidebar
4. **Click "Add people"**
5. **Enter your friends' GitHub usernames or email addresses**
6. **Choose permission level**:
   - **Write**: Can push code and create branches
   - **Maintain**: Can manage issues and pull requests
   - **Admin**: Full access (only for team lead)

### 4. Create Project Board

1. **Go to your repository** on GitHub
2. **Click "Projects"** tab
3. **Click "New project"**
4. **Choose "Board"** template
5. **Name**: `Finance Tracker Development`
6. **Description**: `Project board for tracking development tasks`
7. **Click "Create"**

### 5. Set Up Project Board Columns

Create these columns in order:
- **Backlog**: Future features and ideas
- **To Do**: Tasks for current sprint
- **In Progress**: Currently being worked on
- **Review**: Ready for code review
- **Done**: Completed tasks

### 6. Create Initial Issues

Create these sample issues to get started:

#### Issue 1: Setup Development Environment
```
Title: Setup Development Environment
Labels: documentation, setup
Description:
- Install Node.js and npm
- Install Expo CLI
- Clone repository
- Install dependencies
- Set up environment variables
- Test app locally
```

#### Issue 2: Fix Remaining UI Bugs
```
Title: Fix Remaining UI Bugs
Labels: bug, frontend
Description:
- Test all buttons and interactions
- Fix any layout issues
- Improve error messages
- Test on different screen sizes
```

#### Issue 3: Add Unit Tests
```
Title: Add Unit Tests
Labels: enhancement, testing
Description:
- Set up testing framework
- Write tests for components
- Write tests for hooks
- Write tests for services
- Set up CI/CD pipeline
```

### 7. Set Up Branch Protection

1. **Go to Settings > Branches**
2. **Click "Add rule"**
3. **Branch name pattern**: `main`
4. **Check these options**:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (set to 2)
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
5. **Click "Create"**

## 🤝 Team Workflow

### For New Team Members

1. **Get invited** to the repository
2. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/finance-tracker-app.git
   cd finance-tracker-app
   ```

3. **Set up environment**:
   ```bash
   npm install
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Create your first branch**:
   ```bash
   git checkout -b feature/your-first-feature
   ```

### Daily Workflow

1. **Start your day**:
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** and commit:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create Pull Request** on GitHub

### Code Review Process

1. **Create Pull Request** with:
   - Clear title
   - Detailed description
   - Screenshots if UI changes
   - Link to related issues

2. **Request reviews** from 2 team members

3. **Address feedback** and push updates

4. **Get approval** and merge

## 📊 Project Management

### Using GitHub Projects

1. **Move issues** between columns as work progresses
2. **Assign issues** to team members
3. **Add labels** for categorization
4. **Set due dates** for time-sensitive tasks

### Labels to Create

- `bug`: Bug fixes
- `enhancement`: New features
- `documentation`: Documentation updates
- `design`: UI/UX changes
- `backend`: Backend changes
- `frontend`: Frontend changes
- `high-priority`: Urgent tasks
- `low-priority`: Nice to have features

### Milestones

Create milestones for major releases:
- **v1.0.0**: Initial release
- **v1.1.0**: Bug fixes and improvements
- **v1.2.0**: New features
- **v2.0.0**: Major redesign

## 🔧 Advanced Setup

### GitHub Actions (CI/CD)

Create `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '18'
    - run: npm install
    - run: npm test
```

### Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.md`:
```markdown
---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. iOS, Android, Web]
 - Version [e.g. 1.0.0]
```

## 🎯 Best Practices

### Commit Messages
- Use conventional commits: `feat:`, `fix:`, `docs:`, etc.
- Keep messages clear and descriptive
- Reference issues: `fixes #123`

### Pull Requests
- Keep PRs small and focused
- Include tests for new features
- Update documentation
- Add screenshots for UI changes

### Communication
- Use GitHub Issues for discussions
- Tag team members with @username
- Use reactions to acknowledge messages
- Keep conversations professional

## 🚨 Troubleshooting

### Common Issues

**Permission denied when pushing**:
- Check if you're added as collaborator
- Verify your SSH keys are set up

**Merge conflicts**:
- Always pull latest changes before starting work
- Communicate with team about conflicting changes
- Use `git status` to see conflicts

**Branch protection blocking merge**:
- Ensure you have required approvals
- Check that all status checks pass
- Make sure branch is up to date

---

## 🎉 Next Steps

1. **Invite your friends** to the repository
2. **Set up the project board** with initial tasks
3. **Create your first feature branch**
4. **Start coding together!**

**Remember**: Communication is key! Use GitHub Issues, Pull Requests, and your team chat to stay connected and productive.

---

**Happy collaborating! 🚀**
