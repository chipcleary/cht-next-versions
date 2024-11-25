/**
 * Utilities for managing Google Cloud service accounts
 */

/**
 * Creates shell command to validate a service account exists
 * @param {string} serviceAccount Full service account email
 * @returns {string} Shell command
 */
function createValidateCommand(serviceAccount) {
  return `gcloud iam service-accounts describe "${serviceAccount}" >/dev/null 2>&1`;
}

/**
 * Creates shell command to create a service account
 * @param {string} serviceAccountId Service account ID (without project/domain)
 * @param {string} displayName Display name for the service account
 * @returns {string} Shell command
 */
function createCreateCommand(serviceAccountId, displayName) {
  return `gcloud iam service-accounts create "${serviceAccountId}" \\
    --display-name="${displayName}"`;
}

/**
 * Creates shell command to grant a role to a service account
 * @param {string} projectId GCP project ID
 * @param {string} serviceAccount Full service account email
 * @param {string} role IAM role to grant
 * @returns {string} Shell command
 */
function createGrantRoleCommand(projectId, serviceAccount, role) {
  return `gcloud projects add-iam-policy-binding ${projectId} \\
    --member="serviceAccount:${serviceAccount}" \\
    --role="${role}"`;
}

/**
 * Generates complete service account setup script
 * @param {Object} config Configuration object
 * @param {string} config.projectId GCP project ID
 * @param {string} config.version Version name (used to create SA ID)
 * @param {string[]} [config.roles=['roles/secretmanager.secretAccessor']] Roles to assign
 * @returns {string} Complete bash script for SA management
 */
function generateServiceAccountScript(config) {
  const { projectId, version, roles = ['roles/secretmanager.secretAccessor'] } = config;

  // Convert version to lowercase for SA ID
  const saId = `${version.toLowerCase()}-sa`;
  const serviceAccount = `${saId}@${projectId}.iam.gserviceaccount.com`;
  const displayName = `Service Account for ${version}`;

  return `
# Validate service account ID length
if [ \${#sa_id} -lt 6 ] || [ \${#sa_id} -gt 30 ]; then
  echo "❌ ERROR: Service account ID '\${sa_id}' is \${#sa_id} characters long"
  echo "Service account IDs must be between 6 and 30 characters"
  echo "Your app version '\${_APP_VERSION}' results in a service account ID that is too long"
  echo "Please use a shorter version name"
  exit 1
fi

# Check if service account exists
if ${createValidateCommand(serviceAccount)}; then
  echo "✓ Service account exists"
else
  echo "Creating service account: ${serviceAccount}"
  if ! ${createCreateCommand(saId, displayName)}; then
    echo "❌ Failed to create service account"
    exit 1
  fi
  echo "✓ Service account created"

  # Add a small delay to allow for propagation
  echo "Waiting for service account to be ready..."
  sleep 10
fi

echo "=== Granting Roles ==="
${roles.map(role => `
# Grant ${role}
echo "Granting ${role} to ${serviceAccount}"
if ! ${createGrantRoleCommand(projectId, serviceAccount, role)}; then
  echo "❌ Failed to grant ${role} to ${serviceAccount}"
  echo "This might be because the Cloud Build service account doesn't have permission to grant roles."
  echo "It needs the 'Security Admin' role."
  echo "Run this command to fix:"
  echo "gcloud projects add-iam-policy-binding ${projectId} \\"
  echo "    --member=\\"serviceAccount:cloudbuild-custom@${projectId}.iam.gserviceaccount.com\\" \\"
  echo "    --role=\\"roles/iam.securityAdmin\\""
  exit 1
fi
echo "✓ Granted ${role}"
`).join('\n')}

echo "✓ All roles granted"
`;
}

module.exports = {
  createValidateCommand,
  createCreateCommand,
  createGrantRoleCommand,
  generateServiceAccountScript
};
