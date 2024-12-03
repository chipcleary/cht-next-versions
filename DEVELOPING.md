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

### 2. Hook System Implementation

Hooks are implemented at two levels:

1. Cloud Build level (step injection)
2. Shell Utils level (function injection)

Key hook points:

- validateEnvironment: Before environment checks
- beforeDeploy: Before deployment starts
- afterDeploy: After deployment completes

## Common Development Tasks

### Making Changes

1. Create a new branch for your changes:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes in the `src` directory

   - All source code lives in `src/`
   - The `dist/` directory is generated and should never be edited directly
   - Remember to update tests as needed

3. Run tests to ensure everything works:

   ```bash
   npm test
   ```

4. Build the package locally to verify the build process:

   ```bash
   npm run build
   ```

5. Commit your changes with meaningful commit messages:
   ```bash
   git add .
   git commit -m "feat: description of your changes"
   ```

### Creating a New Release

#### Beta Release

For testing new features or changes:

1. Ensure your changes are committed and you're on the main branch:

   ```bash
   git checkout main
   git pull origin main
   ```

2. Run tests and build:

   ```bash
   npm test
   npm run build
   ```

3. Create and publish a beta release:

   ```bash
   npm run release:beta
   ```

   This will:

   - Run tests
   - Create a new prerelease version
   - Create a git tag
   - Push to GitHub
   - Publish to GitHub Packages with the 'beta' tag

4. Test the beta release in your example apps:
   ```bash
   cd examples/your-example-app
   npm install @cht/next-versions@beta
   ```

#### Production Release

When ready to release a stable version:

1. Ensure all changes are committed and you're on the main branch:

   ```bash
   git checkout main
   git pull origin main
   ```

2. Run tests and build:

   ```bash
   npm test
   npm run build
   ```

3. Create and publish the release:
   ```bash
   npm run release
   ```
   This will:
   - Run tests
   - Increment the patch version
   - Create a git tag
   - Push to GitHub
   - Publish to GitHub Packages

#### Troubleshooting

If a publish fails:

1. Check that you're logged in to the GitHub Package Registry
2. Verify your PAT has the correct permissions
3. Ensure all tests pass
4. Make sure the version number hasn't already been used

If you need to unpublish a version (within 72 hours of publishing):

```bash
npm unpublish @cht/next-versions@<version>
```

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
