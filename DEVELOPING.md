# Developing CHT Next Versions

Internal guide for package development and maintenance.

## Core Concepts

### 1. File Organization

```
src/
├── cli                  # Orchestrates the process
├── processors           # Template processors
├── utils/*              # Core utilities
└── templates/*          # Base templates
```

### 1. Hook System Implementation

Hooks are implemented at two levels:

1. Cloud Build level (step injection)
2. Shell Utils level (function injection)

Key hook points:

- validateEnvironment: Before environment checks
- beforeDeploy: Before deployment starts
- afterDeploy: After deployment completes

## Development Workflow

### Repository Management

1. Clone the repository:

   ```bash
   git clone git@github.com:your-org/cht-next-versions.git
   cd cht-next-versions
   ```

2. Create a new branch for your changes:

   ```bash
   git checkout -b feature/your-feature
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Making Changes

1. Development cycle:

   ```bash
   # Make changes to code
   # Update tests
   npm test
   # Commit changes with descriptive message
   git add .
   git commit -m "feat: description of your changes"
   ```

2. Before submitting PR:

   - Ensure all tests pass
   - Update documentation if needed
   - Consider backward compatibility
   - Add examples for new features

3. Create Pull Request:

   - Use descriptive title
   - Reference any related issues
   - Provide context and testing instructions

4. Adding Features

   - Consider hook points for extensibility
   - Update documentation
   - Add examples
   - Consider backward compatibility

5. Testing
   - Unit tests for utilities
   - Integration tests for processors
   - Manual deployment testing

## Common Tasks

### Adding a New Hook Point

1. Add hook point in shell template:

```bash
# [HOOK: newHookName]
```

2. Add processor support:

```javascript
if (config.hooks?.newHookName) {
  content = content.replace('# [HOOK: newHookName]', config.hooks.newHookName());
}
```

3. Update tests and documentation

### Modifying Resource Names

1. Update `resource-utils.js`
2. Consider GCP naming constraints
3. Update validation tests
4. Update shell utils if needed

### Repository Tasks

1. Creating a new release:

   ```bash
   # Update version
   npm version patch|minor|major

   # Push changes and tags
   git push origin main --tags
   ```

2. Branch management:

   ```bash
   # Update main
   git checkout main
   git pull origin main

   # Create feature branch
   git checkout -b feature/name

   # Merge completed feature
   git checkout main
   git merge feature/name
   git push origin main
   ```

3. Handling hotfixes:
   ```bash
   git checkout -b hotfix/description
   # Make changes
   npm version patch
   git push origin hotfix/description
   # Create PR for hotfix
   ```

## Testing

### Running Tests

```bash
# Full test suite
npm test

# Single test file
npm test -- src/utils/__tests__/name-utils.test.js

# Watch mode
npm test -- --watch
```

### Test Organization

- `__tests__/` directories alongside source
- Unit tests for utilities
- Integration tests for processors
- Separate test files for each module

## Release Process

1. Update version:

   ```bash
   npm version patch|minor|major
   ```

2. Run tests:

   ```bash
   npm test
   ```

3. Build and publish:
   ```bash
   npm publish
   ```

## Future Development

### Planned Features

- Config management integration
- Custom domain support
- Additional cloud providers

### Extension Points

The package is designed for extension through:

1. Hook system
2. Template customization
3. Resource naming utilities

Consider these when adding features to maintain flexibility.
