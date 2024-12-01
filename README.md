# CHT Next Versions

Enables Vercel-like deployment workflows for Next.js applications on Google Cloud Run, providing automated versioning and preview environments.

## Why This Package?

While Vercel offers built-in preview deployments and automatic version management for Next.js applications, deploying to Google Cloud Run traditionally requires you to manually configure services and permissions and lacks native support for preview environments. This package bridges that gap.

Without this package, you'd need to manually configure for each app version you want to deploy a service account, IAM roles, a build process, and a deployment scripts. This package reduces that to a simple command.

```bash
npm run deploy staging    # Deploy staging version
```

## Features

- Automates deployment
- Handles GCP setup
- Supports app versions (staging, prod, feature branches, ...)
- Supports local development
- Customize deployment via config (cht-next-versions.config.cjs)
- Manages service accounts and IAM permossions
- Provides a unique, predictable URL for each app version
- Sets process.env.APP_VERSION to the app version you specified

## Deploying Your Project

### Terminal Command

```bash
npm run deploy -- `<version>`
```

Note: The -- is required to pass command line arguments through npm to the underlying script.

### Options:

```bash
--log-level <level> # Set logging verbosity (default: 'info')
```

Available levels: error, warn, info, http, verbose, debug, silly

### Examples

```bash
- npm run -- deploy feature-x
- npm run -- deploy staging
- npm run -- deploy prod
- npm run -- deploy -- staging --log-level debug
```

### Deploying locally

You can run your app locally with the version set to 'local' by running either:

```bash
# Start development server
npm run dev

*or*

# Build and start locally
npm start
```

Local deployment will _not_ run any hooks in `cht-next-versions.config.cjs`. If your hooks do any work you require, you will have to perform that manually (e.g., include env variables that would be generated during deployment in `.env.development`).

## Initial Project Setup

Before deploying your app, you need to set up your project. These are one-time tasks for the project regardless of how many app versions you deploy. They establish the Google Clouds infrastructure your project needs to deploy multiple app versions.

### Prerequisites

- A Google Cloud Platform (GCP) project
- Project Editor or Owner role
- An active billing account
- Google Cloud CLI installed and configured
- npm and Node.js 18+ installed

### Steps

#### 1. Install the package:

```bash
npm install @cht/next-versions
```

#### 2. Run the setup script:

This sets up your Google Cloud project with infrastructure it needs to deploy app versions.

```bash
npx setup-gcloud-project \
    -p <your-project-id> \
    -n "<Your Project Name>" \
    -b <your-billing-account-id>
```

//TODO: Still Needed??? If so, add to the setup script. (I think the package does it automagically)

It also creates these subdirectories that used during deployment:

- public
- .next/standalone
- .next/static"

To find your billing account id, run:

```bash
gcloud billing accounts list
```

#### 3. Create a deployment script (typically in scripts/deploy.js):

This calls the package's automatic deployment functionality.

```javascript
#!/usr/bin/env node

import { program } from 'commander';
import { deploy } from '@cht/next-versions/cli';
import { logger } from '@cht/next-versions';

program
  .argument('<version>', 'version to deploy')
  .option('--log-level <level>', 'logging level', 'info')
  .action(async (version, options) => {
    try {
      await deploy(version, { logLevel: options.logLevel });
    } catch (error) {
      logger.error('Deployment failed:', error);
      process.exit(1);
    }
  });

program.parse();
```

#### 4. Update package.json to reference the deployment script

This allows you to deploy using "npm run deploy -- `<app-version>`"

```json
{
  "scripts": {
    "deploy": "node scripts/deploy.js"
  }
}
```

#### 5. (Optional) Customize your build process

Capture customizations in a `cht-next-versions.config.cjs` configuration file in your root directory

This file captures "hooks" you create to customize your builds. It's not required if you don't want any customization.

```javascript
/** @type {import('@cht/next-versions').Config} */
module.exports = {
  // Insert your region
  region: 'us-central1',

  // Override the default Artifact Registory repository if desired
  //repository: 'cloud-run-source-deploy',

  // Add deployment hooks
  hooks: {
    // Run after successful deployment
    postDeploy: async (version, url) => {
      console.log(`Deployed ${version} to ${url}`);
      // Add custom post-deployment steps here
    },
  },
};
```

#### That's it!

You can now deploy your app.

## Creating Hooks

Hooks are functions that run at specific points during the deployment process. These hooks are supported:

- TODO: Insert list of hooks.

See the examples for ideas on how to define hooks.

## Generated Files

During each deployment, the package will generate (or regenerate) these files in your project's root directory:

- `next.config.js`: Cloud Run configuration
- `cloudbuild.yaml`: Deployment steps
- `cht-utils.sh`: Deployment utilities used in `cloudbuild.yaml`

Do not manually edit these files. If you want additional commands in one, create a hook in cht-next-versions.config.cjs. When you deploy again, the package will regenerate the files and so incorporate your modified hooks.

## File Structure

```
<your-project>/
├── pages/
│   └── index.js                 # Your Next.js pages (or `<your-project>/app/...`) if you use the app router
├── package.json                  # Project config (create this)├── scripts/
│   └── deploy.js                # Deployment script (create this)
└── cht-next-versions.config.cjs # Configuration file (create this)

```

## Notes about Environment Variables

You can create a `.env.development` file for local development variables. These values are only used during local development (`next dev`). For deployed versions, the deployment process can set the appropriate environment variables. See examples/load-secret-example to illustrate how.

## Clean-up

This package will generate service accounts for each app version (along with services and IAM policies). If you no longer require one of the app versions you have deployed, you can use these commands to clean up these resources.

**WARNING**: To delete service accounts created by this package, only use these commands. Do NOT delete system service accounts (like @cloudbuild.gserviceaccount.com) as they are required for GCP services to function.

#### List package-created service accounts

```bash
echo "Listing service accounts that you could choose to delete..."
PROJECT_ID=$(gcloud config get-value project)
gcloud iam service-accounts list \
  --format="value(email)" \
  --filter="email ~ ${PROJECT_ID}-.*@${PROJECT_ID}.iam.gserviceaccount.com$"
```

#### Delete one

gcloud iam service-accounts delete <account-email>")

#### Delete all

```bash
echo "Listing service accounts to be deleted..."
PROJECT_ID=$(gcloud config get-value project)
gcloud iam service-accounts list \
  --format="value(email)" \
  --filter="email ~ ${PROJECT_ID}-.*@${PROJECT_ID}.iam.gserviceaccount.com$" | while read -r email; do
  echo "Deleting service account: $email"
  gcloud iam service-accounts delete "$email" --quiet
done
```
