# Basic Example

Demonstrates basic usage of CHT Next Versions with a minimal Next.js application.

## Features
- Simple page showing current deployment version
- Basic deployment script
- Multiple version deployment (staging, prod, feature branches)
- Local development support

## Setup

```bash
# Install dependencies
npm install

# If running from repo, link main package
npm link ../../
```

## Local Development

```bash
# Start development server
npm run dev

# Build and start locally
npm run build
npm start
```

The app will show 'local' as the version when running locally.

## Deployment

```bash
# Deploy staging version
npm run deploy staging

# Deploy production version
npm run deploy prod

# Deploy feature branch
npm run deploy feature-x
```

## Generated vs. Created Files

This example includes files you need to create:
- `pages/index.js`: Simple page showing version
- `scripts/deploy.js`: Deployment script using CHT Next Versions
- `package.json`: Project configuration and scripts

The following files will be generated during deployment:
- `next.config.js`: Generated with Cloud Run configuration
- `cloudbuild.yaml`: Generated with deployment steps
- `cht-utils.sh`: Generated with deployment utilities

## File Structure
```
basic-example/
├── pages/
│   └── index.js        # Main page (create this)
├── scripts/
│   └── deploy.js       # Deployment script (create this)
└── package.json        # Project config (create this)
```

## Requirements

- For local development:
  - Node.js 18+

- For deployment:
  - Google Cloud project with required APIs enabled
  - Google Cloud CLI installed and configured

## Troubleshooting

### Directory Structure
The deployment process expects certain directories to exist. The `npm run deploy` command automatically creates these directories, but if you encounter COPY errors, ensure these directories exist:

```
basic-example/
├── public/              # Static files (created automatically)
├── .next/              # Next.js build output (created automatically)
│   ├── standalone/     # Standalone build output
│   └── static/         # Static assets
└── ...
```

### Common Issues

1. COPY failed errors:
   ```
   COPY failed: stat app/public: file does not exist
   COPY failed: stat app/.next/standalone: file does not exist
   ```
   Solution: Run `npm run ensure-dirs` to create required directories

2. Build failures:
   - Ensure you have run `npm install`
   - Check that all required dependencies are installed
   - Verify your Next.js configuration is valid

3. Deployment failures:
   - Check your Google Cloud permissions
   - Ensure the required APIs are enabled
   - Verify your billing account is active
