# Contributing to H2Char

Thank you for your interest in contributing to H2Char! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

- Familiarity with Git and GitHub
- Python 3.8+ development environment
- Basic understanding of 3D animation and motion retargeting

### Setting Up Development Environment

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/yourusername/H2Char.git
cd H2Char
```

3. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate    # Windows
```

4. Install development dependencies:
```bash
pip install -r requirements-dev.txt
```

5. Set up pre-commit hooks:
```bash
pre-commit install
```

## Development Workflow

### Branch Naming Convention

Use descriptive branch names:
- `feature/description` for new features
- `bugfix/description` for bug fixes
- `docs/description` for documentation
- `refactor/description` for refactoring

### Commit Message Format

Follow conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation
- `style`: formatting
- `refactor`: code refactoring
- `test`: adding tests
- `chore`: maintenance

Example:
```
feat(retargeting): add contact point preservation

- Implement contact detection algorithm
- Add contact preservation loss function
- Update documentation

Closes #123
```

## Pull Request Process

1. **Create a Feature Branch**: Never commit directly to `main`
2. **Write Tests**: Include unit tests for new functionality
3. **Update Documentation**: Update README and docstrings
4. **Run Tests**: Ensure all tests pass
5. **Submit PR**: Create a pull request with clear description

### PR Review Checklist

Before submitting:
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Code is well-commented

## Style Guidelines

### Python Code Style

Follow PEP 8 with some exceptions:
- Line length: 100 characters
- Use type hints where appropriate
- Document all public functions and classes

### Documentation Standards

- Use Google-style docstrings
- Include examples in docstrings
- Update README for significant changes

### Testing Requirements

- Aim for 80%+ test coverage
- Write both unit and integration tests
- Use descriptive test names

## Reporting Bugs

Use the bug report template and include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Error logs/screenshots

## Feature Requests

Use the feature request template and include:
- Problem description
- Proposed solution
- Use cases
- Implementation ideas

## Getting Help

- Check existing issues and documentation first
- Join our discussions
- Contact maintainers for urgent issues

## Recognition

Contributors will be recognized in:
- Release notes
- Contributor list
- Project documentation

Thank you for contributing to H2Char!