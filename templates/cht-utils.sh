#!/bin/bash

# Print formatted section header
print_section() {
    echo "*** $1 ***"
    echo "=== $2 ==="
}

# Convert version to lowercase
sanitize_version() {
    echo "$1" | tr '[:upper:]' '[:lower:]'
}

# Get service name from project and version
get_service_name() {
    local project_id="$1"
    local version="$(sanitize_version "$2")"
    echo "${project_id}-${version}"
}

validate_environment_hook() {
    # [HOOK: validateEnvironment]
}

# Validate environment and resources
validate_environment() {
    local project_id="$1"
    local version="$2"
    local region="$3"
    local repository="$4"

    print_section "ENVIRONMENT VALIDATION" "Environment Information"
    echo "Project ID: ${project_id}"
    echo "App Version: ${version}"
    echo "Region: ${region}"
    echo "Repository: ${repository}"

    local service_name=$(get_service_name "$project_id" "$version")
    echo "Service name: $service_name"
    echo "Expected URL: https://${service_name}-${region}.run.app"

    validate_environment_hook # Call the hook function here

    print_section "VALIDATION" "Docker Repository"
    if ! gcloud artifacts repositories describe "$repository" \
        --location="$region" >/dev/null 2>&1; then
        echo "❌ ERROR: Repository $repository not found in $region"
        echo ""
        echo "To fix this, run:"
        echo "gcloud artifacts repositories create $repository \\"
        echo "    --repository-format=docker \\"
        echo "    --location=$region \\"
        echo "    --description=\"Docker repository for $project_id\""
        exit 1
    fi
    echo "✓ Docker repository exists"
    echo "✓ Environment validation complete"
}

before_deploy_hook() {
    # [HOOK: beforeDeploy]
}

# Build and push Docker image
build_and_push_image() {
    local project_id="$1"
    local version="$2"
    local region="$3"
    local repository="$4"
    local github_token="$5"  # New parameter

    local sanitized_version=$(sanitize_version "$version")
    local image_path="${region}-docker.pkg.dev/${project_id}/${repository}/${sanitized_version}"

    print_section "BUILD" "Building Docker Image"
    docker build \
        --build-arg "APP_VERSION=${version}" \
        --build-arg "GITHUB_PACKAGES_TOKEN=${github_token}" \
        -t "$image_path" \
        --label "app-version=${version}" \
        --label "project-id=${project_id}" \
        . || exit 1

    before_deploy_hook # Call the hook function here

    print_section "PUSH" "Pushing Docker Image"
    docker push "$image_path" || exit 1
    echo "✓ Image built and pushed successfully"
}

after_deploy_hook() {
    # [HOOK: afterDeploy]
}

# Deploy to Cloud Run
deploy_to_cloud_run() {
    local project_id="$1"
    local version="$2"
    local region="$3"
    local repository="$4"

    local sanitized_version=$(sanitize_version "$version")
    local service_name=$(get_service_name "$project_id" "$sanitized_version")
    local image_path="${region}-docker.pkg.dev/${project_id}/${repository}/${sanitized_version}"
    local sa_id="${sanitized_version}-sa"
    local service_account="${sa_id}@${project_id}.iam.gserviceaccount.com"

    # Print debug information
    echo "Sanitized Version: $sanitized_version"
    echo "Project ID: $project_id"
    echo "Service Account Email: $service_account"
    echo "Setup call: setup_service_account "$service_account" "$sa_id" "$service_name" || exit 1"

    print_section "DEPLOY" "Service Account Setup"
    setup_service_account "$service_account" "$sa_id" "$service_name" || exit 1

    local tag_name="v-1"
    print_section "DEPLOY" "Cloud Run Deployment"
    echo "Service: $service_name"
    echo "Image: $image_path"
    echo "Service account: $service_account"

    after_deploy_hook # Call the hook function here

    # Removed --allow-unauthenticated flag from here
    gcloud run deploy "$service_name" \
        --image="$image_path" \
        --platform=managed \
        --region="$region" \
        --service-account="$service_account" \
        --tag="$tag_name" \
        --set-env-vars="APP_VERSION=${version}" || exit 1

    print_section "COMPLETE" "Deployment Status"
    echo "Service URL: $(gcloud run services describe $service_name \
        --region="$region" \
        --format='value(status.url)')"
}

# Setup service account
setup_service_account() {
    local service_account="$1"
    local sa_id="$2"
    local service_name="$3"

    echo "Service account ID: $sa_id"

    # Validate length
    if [ ${#sa_id} -lt 6 ] || [ ${#sa_id} -gt 30 ]; then
        echo "❌ ERROR: Service account ID '${sa_id}' is ${#sa_id} characters long"
        echo "Service account IDs must be between 6 and 30 characters"
        return 1
    fi

    if gcloud iam service-accounts describe "$service_account" >/dev/null 2>&1; then
        echo "✓ Service account exists"
    else
        echo "Creating service account: $service_account"
        if ! gcloud iam service-accounts create "$sa_id" \
            --display-name="Service Account for $service_name"; then
            echo "❌ Failed to create service account"
            return 1
        fi
        echo "✓ Service account created"
        echo "Waiting for propagation..."
        sleep 10
    fi

    return 0
}
