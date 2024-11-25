# CHT Next Versions

Enables Vercel-like deployment workflows for Next.js applications on Google Cloud Run, providing automated versioning and preview environments.

## Why This Package?

While Vercel offers built-in preview deployments and automatic version management for Next.js applications, deploying to Google Cloud Run traditionally requires manual configuration and lacks native support for preview environments. This package bridges that gap.

### Problems Solved
- Creates Vercel-like preview environments on Google Cloud Run
- Automates deployment of multiple versions (staging, production, feature branches)
- Handles complex GCP setup automatically:
  - Service account management
  - IAM permissions
  - Build configuration
  - Deployment automation
- Provides predictable, version-specific URLs
- Simplifies local development integration

Without this package, you'd need to manually configure service accounts, IAM roles, build processes, and deployment scripts for each version of your application. This package reduces that to a simple command:
```bash
npm run deploy staging    # Deploy staging version
npm run deploy prod      # Deploy production version
npm run deploy feature-x # Deploy feature branch

## Features
Features

Simple page showing current deployment version
Automated deployment script
Multiple version deployment (staging, prod, feature branches)
Local development support
Automatic service account and IAM management
Zero-config versioning with unique URLs

## Initial Setup

### 1. Google Cloud Setup
```bash
# Verify gcloud is installed
gcloud --version

# Login to Google Cloud
gcloud auth login

# Create new project (choose a globally unique ID)
gcloud projects create your-project-id --name="Your Project Name"

# Set as current project
gcloud config set project your-project-id

# Login to the project
gcloud auth application-default login

# Set quota project
gcloud auth application-default set-quota-project your-project-id

# Link billing account (required for deployment)
gcloud billing projects link your-project-id --billing-account=YOUR_BILLING_ACCOUNT_ID

# To find your billing account ID if needed:
gcloud billing accounts list

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com

# Create Artifact Registry repository
gcloud artifacts repositories create cloud-run-source-deploy \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker repository for deployments"

# Grant necessary permissions to Cloud Build
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
    --role="roles/run.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"
```

### 2. Project Setup

1. Install the package:
```bash
npm install @cht/next-versions
```

2. Create a deployment script (scripts/deploy.js):
```javascript
#!/usr/bin/env node
const { deploy } = require('@cht/next-versions/cli');
deploy(process.argv[2]);
```

3. Add the deploy script to package.json:
```json
{
  "scripts": {
    "deploy": "node scripts/deploy.js"
  }
}
```

4. (Optional) Create a configuration file (cht-next-versions.config.js):
```javascript
/** @type {import('@cht/next-versions').Config} */
module.exports = {
  // Override default region if needed
  // region: 'us-central1',

  // Override default repository if needed
  // repository: 'cloud-run-source-deploy',

  // Add deployment hooks
  hooks: {
    // Run after successful deployment
    postDeploy: async (version, url) => {
      console.log(`Deployed ${version} to ${url}`);
      // Add custom post-deployment steps here
    }
  }
};
```

That's it! You can now deploy your app using:
```bash
npm run deploy staging    # Deploy staging version
npm run deploy prod      # Deploy production version
npm run deploy feature-x # Deploy feature branch
```

The deployment process will:
1. Generate necessary configuration files (next.config.js, cloudbuild.yaml)
2. Set up required Cloud Run resources
3. Build and deploy your application
4. Provide a unique URL for your version

## Local Development

```bash
# Start development server
npm run dev

# Build and start locally
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
- `app/page.js`: Simple page showing version
- `scripts/deploy.js`: Deployment script using CHT Next Versions
- `package.json`: Project configuration and scripts

The following files will be generated during deployment:
- `next.config.js`: Generated with Cloud Run configuration
- `cloudbuild.yaml`: Generated with deployment steps
- `cht-utils.sh`: Generated with deployment utilities

## File Structure
```
basic-example/
├── app/
│   ├── page.js          # Main page (create this)
│   ├── layout.js        # Root layout
│   └── globals.css      # Global styles
├── scripts/
│   └── deploy.js        # Deployment script (create this)
└── package.json         # Project config (create this)
```

## Requirements

- For local development:
  - Node.js 18+

- For deployment:
  - Google Cloud project with required APIs enabled
  - Google Cloud CLI installed and configured
  - Project Owner or roles to grant IAM permissions:
    - roles/run.admin (Cloud Run Admin)
    - roles/iam.serviceAccountUser (Service Account User)
    - roles/iam.securityAdmin (Security Admin)
  - Active billing account
  - Project Editor or Owner role

## Notes about Environment Variables
The example includes a `.env.development` file for local development variables. These values are only used during local development (`next dev`). For production values, the deployment process handles setting the appropriate environment variables.
