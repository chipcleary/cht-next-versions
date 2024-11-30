# CHT Next Versions Examples

This directory contains examples demonstrating how to use CHT Next Versions.

## Examples

### basic-example/

A minimal setup showing version-based deployments. Features:

- Simple Next.js page showing current version
- Deployment script using CHT Next Versions
- Basic configuration

## Running Examples

Each example can be run in two ways:

### 1. Copy to New Project

```bash
# Create new project
mkdir my-project
cd my-project

# Copy example
cp -r node_modules/@cht/next-versions/examples/basic-example/* .

# Install dependencies
npm install

# Deploy

npm run deploy -- <version>

Note: The -- is required to pass command line arguments through npm to the underlying script.

##Options:

--log-level <level> Set logging verbosity (default: 'info')
Available levels: error, warn, info, http, verbose, debug, silly

## Examples
npm run -- deploy staging
npm run -- deploy -- staging --log-level debug
```

### 2. Run Directly

```bash
# From the cht-next-versions repo
cd examples/basic-example

# Install dependencies
npm install

# Link main package
npm link ../../

# Deploy
npm run deploy staging
```
