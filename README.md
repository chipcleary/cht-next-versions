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

````bash
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

## Initial Setup

# To find your billing account ID if needed:
gcloud billing accounts list

### 1. Google Cloud Setup

## Project Setup

####. Find your billing account ID:

gcloud billing accounts list

#### Run the setup script:

./tools/setup/setup-gcloud-project.sh \
    -p your-project-id \
    -n "Your Project Name" \
    -b your-billing-account-id

#### Note About Service Accounts
As of May/June 2024, Google Cloud has changed how Cloud Build handles service accounts:
- New projects use the Compute Engine default service account for builds
- "setup-gcloud-project.sh" configures the correct service account
- Organization users may need to adjust their policies (see documentation https://cloud.google.com/build/docs/cloud-build-service-account-updates

#OLD
# Set required script variables
$PROJECT_NAME=CHT Next Versions V2
$PROJECT_ID=cht-next-versions-v2
$BILLING_ID="01E622-A37367-1E45A1"

# Verify gcloud is installed
gcloud --version

# Login to Google Cloud
gcloud auth login

# Create new project (choose a globally unique ID)
gcloud projects create your-project-id --name="$PROJECT_NAME"


# Set as current project
gcloud config set project $PROJECT_ID

# Login to the project
gcloud auth application-default login

# Set quota project
gcloud auth application-default set-quota-project $PROJECT_ID

# Link billing account (required for deployment)
gcloud billing projects link $PROJECT_ID --billing-account=$BILLING_ID

# Get and verify project configuration
RETRIEVED_PROJECT_ID=$(gcloud config get-value project)
if [ -z "$RETRIEVED_PROJECT_ID" ]; then
    echo "No project ID configured. Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi
echo "Configuring project: $RETRIEVED_PROJECT_ID"

# Enable required APIs
echo "Enabling required APIs..."
gcloud services enable \
    cloudresourcemanager.googleapis.com \
    iam.googleapis.com

# Wait for IAM to be ready
sleep 10

echo "Enabling deployment APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    artifactregistry.googleapis.com

# Wait for APIs to be fully enabled and service accounts to be created
sleep 20

# Get project details
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
CURRENT_USER=$(gcloud config get-value account)

# Verify Cloud Build service account exists
echo "Waiting for Cloud Build service account creation..."
MAX_RETRIES=6
RETRY_COUNT=0
while ! gcloud iam service-accounts describe "$CLOUDBUILD_SA" &>/dev/null; do
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "ERROR: Cloud Build service account not created after 60 seconds"
        exit 1
    fi
    echo "Waiting for service account creation... (attempt $((RETRY_COUNT+1)))"
    sleep 10
    RETRY_COUNT=$((RETRY_COUNT+1))
done

# Create Artifact Registry repository
echo "Creating Artifact Registry repository..."
gcloud artifacts repositories create cloud-run-source-deploy \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker repository for deployments"

# Grant necessary permissions to Cloud Build service account
CLOUDBUILD_ROLES=(
    "roles/run.admin"
    "roles/iam.serviceAccountUser"
    "roles/iam.serviceAccountAdmin"
    "roles/iam.securityAdmin"
    "roles/run.developer"
    "roles/run.invoker"
    "roles/cloudbuild.builds.builder"
)

echo "Granting roles to Cloud Build service account ($CLOUDBUILD_SA)..."
for ROLE in "${CLOUDBUILD_ROLES[@]}"; do
    echo "Granting $ROLE to Cloud Build service account..."
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:$CLOUDBUILD_SA" \
        --role="$ROLE"
done

# Grant necessary permissions to the current user
USER_ACCOUNT_ROLES=(
    "roles/iam.serviceAccountUser"
    "roles/iam.serviceAccountTokenCreator"
)

echo "Granting roles to user account ($CURRENT_USER)..."
for ROLE in "${USER_ACCOUNT_ROLES[@]}"; do
    echo "Granting $ROLE to current user..."
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="user:$CURRENT_USER" \
        --role="$ROLE"
done

# Verify permissions
echo "Verifying permissions..."
gcloud iam service-accounts get-iam-policy $CLOUDBUILD_SA

echo "Setup complete! Verifying with a test build..."

# Create and run a test build to verify everything works
cat > test-cloudbuild.yaml <<EOF
steps:
- name: 'gcr.io/cloud-builders/gcloud'
  args: ['info']
EOF

gcloud builds submit --no-source --config test-cloudbuild.yaml

echo "If the test build succeeded, your environment is properly configured!"

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

4. (Optional) Create a configuration file (cht-next-versions.config.cjs):

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
    },
  },
};
```

That's it! You can now deploy your app using:

```bash
npm run deploy staging    # Deploy staging version
npm run deploy prod      # Deploy production version
npm run deploy feature-x # Deploy feature branch
```

The deployment process will:

1. Generate necessary configuration files (next.config.cjs, cloudbuild.yaml)
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

This example illustrates files you need to create:

- `app/page.js`: Simple page showing version
- `scripts/deploy.js`: Deployment script using CHT Next Versions
- `package.json`: Project configuration and scripts

The following files will be generated during deployment:

- `next.config.cjs`: Generated with Cloud Run configuration
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

## Clean-up

This package will generate service accounts for each app version (along with services and IAM policies). To clean up these resources, you can use the following commands.

**WARNING**: Only use these commands to delete service accounts created by this package. Do NOT delete system service accounts (like @cloudbuild.gserviceaccount.com) as they are required for GCP services to function.

#### List package-created service accounts

```bash
PROJECT_ID=$(gcloud config get-value project)
gcloud iam service-accounts list --filter="email ~ ^${PROJECT_ID}-"
### Service accounts

#### List

# List all service accounts matching your package's specific pattern
echo "Listing service accounts to be deleted..."
PROJECT_ID=$(gcloud config get-value project)
gcloud iam service-accounts list \
  --format="value(email)" \
  --filter="email ~ ${PROJECT_ID}-.*@${PROJECT_ID}.iam.gserviceaccount.com$"

#### Delete one

gcloud iam service-accounts delete <account-email>")

#### Delete all

# List all service accounts matching your package's specific pattern
echo "Listing service accounts to be deleted..."
PROJECT_ID=$(gcloud config get-value project)
gcloud iam service-accounts list \
  --format="value(email)" \
  --filter="email ~ ${PROJECT_ID}-.*@${PROJECT_ID}.iam.gserviceaccount.com$" | while read -r email; do
  echo "Deleting service account: $email"
  gcloud iam service-accounts delete "$email" --quiet
done

### Optional: Delete Artifact Registry repository

_Only delete this if you plan to create no further deployments_

gcloud artifacts repositories list --location=us-central1
gcloud artifacts repositories delete cloud-run-source-deploy \
 --location=us-central1 \
 --quiet
```
````
