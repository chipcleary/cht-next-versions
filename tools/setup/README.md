# Project Setup Tools

This directory contains tools for setting up your Google Cloud project for use with cht-next-versions.

## setup-gcloud-project.sh

This script automates the creation and configuration of a Google Cloud project for use with cht-next-versions. It:

- Creates a new Google Cloud project
- Enables required APIs
- Sets up service accounts and permissions
- Creates necessary resources
- Verifies the setup with a test build

### Prerequisites

- Google Cloud SDK (gcloud) installed and in your PATH
- Logged in to gcloud (`gcloud auth login`)
- Access to a Google Cloud billing account

### Usage

#### Command

```bash
./setup-gcloud-project.sh -p PROJECT_ID -n "PROJECT_NAME" -b BILLING_ACCOUNT_ID
```

#### Example

```bash
./setup-gcloud-project.sh \
    -p my-next-versions \
    -n "My Next Versions" \
    -b XXXXXX-XXXXXX-XXXXXX
```

#### To find your billing account

```bash
gcloud billing accounts list
```

#### Service Account Configuration

This script configures Cloud Build to use the Compute Engine default service account, following Google Cloud's May/June 2024 changes. If you're part of an organization that requires the legacy Cloud Build service account, please consult your organization's policies.

##### For Organization Users

If you need to use the legacy Cloud Build service account, your organization needs to set these policies:

- Enforce: `constraints/cloudbuild.useBuildServiceAccount`
- Not Enforce: `constraints/cloudbuild.useComputeServiceAccount`
