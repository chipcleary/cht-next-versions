#!/bin/bash

# Setup script for cht-next-versions Google Cloud project
set -e  # Exit on any error

# Constants and Configurations
LOG_DIR="/tmp"
LOG_FILE="$LOG_DIR/gcloud-setup-$(date +%Y%m%d-%H%M%S).log"
MIN_GCLOUD_VERSION="400.0.0"
QUIET_MODE=false

# Setup logging
exec 1> >(tee -a "$LOG_FILE") 2>&1

# Cleanup function
cleanup() {
    rm -f test-cloudbuild.yaml
    echo "Log file created at: $LOG_FILE"
}
trap cleanup EXIT

# Function to wait for a condition with timeout
function wait_for_condition() {
    local check_command="$1"
    local success_message="$2"
    local failure_message="$3"
    local max_retries="${4:-12}"  # Default to 12 retries (2 minutes total)
    local sleep_time="${5:-10}"   # Default to 10 second intervals

    echo "$success_message..."
    local retry_count=0
    until eval "$check_command"; do
        if [ $retry_count -ge $max_retries ]; then
            echo "ERROR: $failure_message after $((max_retries * sleep_time)) seconds"
            exit 1
        fi
        echo "Waiting... (attempt $((retry_count+1)) of $max_retries)"
        sleep $sleep_time
        retry_count=$((retry_count+1))
    done
    echo "✓ Success!"
}

# Function to display usage
function show_usage() {
    echo "Usage: $0 -p PROJECT_ID -n PROJECT_NAME -b BILLING_ACCOUNT_ID [-q]"
    echo
    echo "Required parameters:"
    echo "  -p PROJECT_ID         Globally unique project ID (e.g., my-next-versions)"
    echo "  -n PROJECT_NAME       Human-friendly project name (e.g., \"My Next Versions\")"
    echo "  -b BILLING_ACCOUNT_ID Billing account ID (run 'gcloud billing accounts list' to find)"
    echo
    echo "Optional parameters:"
    echo "  -q                    Quiet mode - skip confirmations (useful for CI/CD)"
    echo
    exit 1
}

# Parse command line arguments
while getopts "p:n:b:q" opt; do
    case $opt in
        p) PROJECT_ID="$OPTARG" ;;
        n) PROJECT_NAME="$OPTARG" ;;
        b) BILLING_ACCOUNT="$OPTARG" ;;
        q) QUIET_MODE=true ;;
        ?) show_usage ;;
    esac
done

# Verify required parameters
if [ -z "$PROJECT_ID" ] || [ -z "$PROJECT_NAME" ] || [ -z "$BILLING_ACCOUNT" ]; then
    echo "Error: Missing required parameters"
    show_usage
fi

# Check for required tools and versions
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud command not found. Please install the Google Cloud SDK first."
    exit 1
fi

# Retrieve gcloud version using grep
GCLOUD_VERSION=$(gcloud version | grep 'Google Cloud SDK' | awk '{print $4}')

# Check if GCLOUD_VERSION is empty
if [ -z "$GCLOUD_VERSION" ]; then
    echo "Error: Failed to retrieve gcloud version. Please ensure gcloud is installed correctly."
    exit 1
fi

# Compare versions
if ! [[ "$GCLOUD_VERSION" > "$MIN_GCLOUD_VERSION" ]]; then
    echo "Error: gcloud $MIN_GCLOUD_VERSION or higher is required (found $GCLOUD_VERSION). Please update gcloud SDK."
    exit 1
fi

# Interactive verification of billing account if needed
if ! gcloud billing accounts list | grep -q "$BILLING_ACCOUNT"; then
    echo "Error: Billing account $BILLING_ACCOUNT not found. Available billing accounts:"
    gcloud billing accounts list
    echo
    if [ "$QUIET_MODE" = false ]; then
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo "Error: Billing account $BILLING_ACCOUNT not found"
        exit 1
    fi
fi

# Confirm parametrers
echo "Setting up project with:"
echo "  Project ID: $PROJECT_ID"
echo "  Project Name: $PROJECT_NAME"
echo "  Billing Account: $BILLING_ACCOUNT"
echo

if [ "$QUIET_MODE" = false ]; then
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check project ID
echo "Checking if project ID is available..."
if gcloud projects describe "$PROJECT_ID" &>/dev/null; then
    echo "Error: Project ID '$PROJECT_ID' already exists. Please choose a different project ID and try again."
    exit 1
fi

# Create new project
echo "Creating project..."
gcloud projects create "$PROJECT_ID" --name="$PROJECT_NAME"

# Link billing account
echo "Linking billing account..."
gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT"

# Set as current project and configure auth
echo "Setting as current project..."
gcloud config set project "$PROJECT_ID"
gcloud auth application-default login
gcloud auth application-default set-quota-project "$PROJECT_ID"

# Enable required APIs
echo "Enabling services..."
gcloud services enable \
    cloudresourcemanager.googleapis.com \
    iam.googleapis.com \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    artifactregistry.googleapis.com

# Wait for IAM to be ready
wait_for_condition \
    "gcloud iam roles list --project=$PROJECT_ID --limit=1 >/dev/null 2>&1" \
    "Waiting for IAM to be ready" \
    "IAM services not ready"

# Get project details
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
CURRENT_USER=$(gcloud config get-value account)

# Wait for Compute service account
wait_for_condition \
    "gcloud iam service-accounts list --filter='email:${COMPUTE_SA}' --format='get(email)' 2>/dev/null | grep -q ." \
    "Waiting for Compute Engine service account creation" \
    "Compute Engine service account not created"

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
        --role="$ROLE" >/dev/null # Suppress standard output but not error output
done

# Grant permissions to current user
USER_ACCOUNT_ROLES=(
    "roles/iam.serviceAccountUser"
    "roles/iam.serviceAccountTokenCreator"
    "roles/artifactregistry.admin"
)

echo "Granting roles to user account..."
for ROLE in "${USER_ACCOUNT_ROLES[@]}"; do
    echo "Granting $ROLE..."
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="user:$CURRENT_USER" \
        --role="$ROLE" >/dev/null # Suppress standard output but not error output
done


# Wait for Artifact Registry API to be ready
wait_for_condition \
    "gcloud artifacts locations list --limit=1 >/dev/null 2>&1" \
    "Waiting for Artifact Registry API to be ready" \
    "Artifact Registry API not ready"

# Wait for permissions to propagate by testing permission
wait_for_condition \
    "gcloud artifacts repositories list --location=us-central1 >/dev/null 2>&1" \
    "Waiting for Artifact Registry permissions to propagate" \
    "Artifact Registry permissions not ready"

# Create Artifact Registry repository
echo "Creating Artifact Registry repository..."
gcloud artifacts repositories create cloud-run-source-deploy \
    --repository-format=docker \
    --location=us-central1 \
    --description="Docker repository for deployments"

# Wait for Cloud Build to be ready
wait_for_condition \
    "gcloud builds list --limit=1 >/dev/null 2>&1" \
    "Waiting for Cloud Build setup to complete" \
    "Cloud Build setup incomplete" \
    18 # 3 minutes timeout

# Verify setup with test build
echo "Verifying setup with test build..."
cat > test-cloudbuild.yaml <<'EOF'
steps:
- name: 'gcr.io/cloud-builders/gcloud'
  args: ['info']
EOF

if gcloud builds submit --no-source --config test-cloudbuild.yaml; then
    echo "✓ Test build succeeded!"
else
    echo "⨯ Test build failed. Please check the error messages above."
    exit 1
fi

# Create scripts directory and copy deploy.js
echo "Creating deploy script..."
mkdir -p scripts

# Find and copy the deploy.js template
echo "Finding template location..."
GLOBAL_NODE_MODULES="$(npm root -g)"
TEMPLATE_PATH="${GLOBAL_NODE_MODULES}/@cht/next-versions/templates/deploy.js"

# Debug output
echo "Template path: ${TEMPLATE_PATH}"

if [ ! -f "${TEMPLATE_PATH}" ]; then
    echo "Error: Could not find deploy.js template at '${TEMPLATE_PATH}'"
    echo "Global node modules location: '${GLOBAL_NODE_MODULES}'"
    exit 1
fi

# Create scripts directory if it doesn't exist
mkdir -p scripts

# Copy with error checking
if ! cp "${TEMPLATE_PATH}" "scripts/deploy.js"; then
    echo "Error: Failed to copy deploy.js template"
    exit 1
fi

if ! chmod +x "scripts/deploy.js"; then
    echo "Error: Failed to make deploy.js executable"
    exit 1
fi

echo "Successfully created scripts/deploy.js"

echo "=== Setup Complete ==="
echo "Your Google Cloud project is ready to use with cht-next-versions!"
