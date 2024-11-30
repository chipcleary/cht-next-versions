#!/bin/bash

# Setup script for cht-next-versions Google Cloud project
set -e  # Exit on any error

# Function to display usage
function show_usage() {
    echo "Usage: $0 -p PROJECT_ID -n PROJECT_NAME -b BILLING_ACCOUNT_ID"
    echo
    echo "Required parameters:"
    echo "  -p PROJECT_ID         Globally unique project ID (e.g., my-next-versions)"
    echo "  -n PROJECT_NAME       Human-friendly project name (e.g., \"My Next Versions\")"
    echo "  -b BILLING_ACCOUNT_ID Billing account ID (run 'gcloud billing accounts list' to find)"
    echo
    exit 1
}

# Parse command line arguments
while getopts "p:n:b:" opt; do
    case $opt in
        p) PROJECT_ID="$OPTARG" ;;
        n) PROJECT_NAME="$OPTARG" ;;
        b) BILLING_ACCOUNT="$OPTARG" ;;
        ?) show_usage ;;
    esac
done

# Verify required parameters
if [ -z "$PROJECT_ID" ] || [ -z "$PROJECT_NAME" ] || [ -z "$BILLING_ACCOUNT" ]; then
    echo "Error: Missing required parameters"
    show_usage
fi

# Interactive verification of billing account if needed
if ! gcloud billing accounts list | grep -q "$BILLING_ACCOUNT"; then
    echo "Available billing accounts:"
    gcloud billing accounts list
    echo
    read -p "Billing account $BILLING_ACCOUNT not found. Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Setting up project with:"
echo "  Project ID: $PROJECT_ID"
echo "  Project Name: $PROJECT_NAME"
echo "  Billing Account: $BILLING_ACCOUNT"
echo
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Verify gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud not found. Please install Google Cloud SDK first."
    exit 1
fi

echo "Checking if project ID is available..."
if gcloud projects describe "$PROJECT_ID" &>/dev/null; then
    echo "Error: Project ID '$PROJECT_ID' already exists."
    echo "Please choose a different project ID and try again."
    exit 1
fi

echo "=== Starting Setup ==="

# Create new project
echo "Creating project..."
gcloud projects create "$PROJECT_ID" --name="$PROJECT_NAME"

# Set as current project
echo "Setting as current project..."
gcloud config set project "$PROJECT_ID"
# After gcloud config set project "$PROJECT_ID"
gcloud auth application-default login
gcloud auth application-default set-quota-project "$PROJECT_ID"

# Link billing account
echo "Linking billing account..."
gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"

# Enable required APIs
echo "Enabling services ..."
gcloud services enable \
    # core services
    cloudresourcemanager.googleapis.com \
    iam.googleapis.com \
    # deployment APIs
    cloudbuild.googleapis.com \
    run.googleapis.com \
    artifactregistry.googleapis.com

echo "Waiting for IAM to be ready..."
sleep 10

# Get project details
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
CURRENT_USER=$(gcloud config get-value account)

# Verify Cloud Build service account (which as of Jun 2024 uses the $COMPUTE_SA)
echo "Waiting for Compute Engine service account creation..."
MAX_RETRIES=6
RETRY_COUNT=0
while ! gcloud iam service-accounts list --filter="email:${COMPUTE_SA}" --format="get(email)" &>/dev/null; do
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "ERROR: Compute Engine service account not created after 60 seconds"
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

# Grant permissions to Cloud Build service account
CLOUDBUILD_ROLES=(
    "roles/run.admin"
    "roles/iam.serviceAccountUser"
    "roles/iam.serviceAccountAdmin"
    "roles/iam.securityAdmin"
    "roles/run.developer"
    "roles/run.invoker"
    "roles/cloudbuild.builds.builder"
)

echo "Granting roles to Cloud Build service account..."
for ROLE in "${CLOUDBUILD_ROLES[@]}"; do
    echo "Granting $ROLE..."
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$COMPUTE_SA" \
        --role="$ROLE"
done

# Grant permissions to current user
USER_ACCOUNT_ROLES=(
    "roles/iam.serviceAccountUser"
    "roles/iam.serviceAccountTokenCreator"
)

echo "Granting roles to user account..."
for ROLE in "${USER_ACCOUNT_ROLES[@]}"; do
    echo "Granting $ROLE..."
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="user:$CURRENT_USER" \
        --role="$ROLE"
done

# Verify setup with test build
echo "Verifying setup with test build..."
cat > test-cloudbuild.yaml <<EOF
steps:
- name: 'gcr.io/cloud-builders/gcloud'
  args: ['info']
EOF

if gcloud builds submit --no-source --config test-cloudbuild.yaml; then
    echo "✓ Test build succeeded!"
    rm test-cloudbuild.yaml
else
    echo "⨯ Test build failed. Please check the error messages above."
    rm test-cloudbuild.yaml
    exit 1
fi

echo "=== Setup Complete ==="
echo "Your Google Cloud project is ready to use with cht-next-versions!"
