# Basic Example

Demonstrates basic usage of CHT Next Versions with a minimal Next.js application.

## Features
- Simple page showing current deployment version
- Basic deployment script
- Multiple version deployment (staging, prod, feature branches)
- Local development support

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
```bash
# Install dependencies (removes @cht/next-versions from dependencies first)
npm remove @cht/next-versions
npm install

# Link local package
npm link ../../
```

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
