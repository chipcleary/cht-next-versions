const { execSync } = require('child_process');
const fs = require('fs/promises');
const {
  processCloudBuildTemplate,
  processDockerfileTemplate,
  processNextConfig
} = require('../index');

/**
 * Utility functions for deployment management
 */

/**
 * Converts a version string to a valid service name
 * Ensures compliance with GCP naming restrictions
 * @param {Object} config
 * @param {string} config.projectId - GCP project ID
 * @param {string} config.version - Version name
 * @returns {string} Valid Cloud Run service name
 */
function toServiceName({ projectId, version }) {
  const sanitizedVersion = version.toLowerCase();
  return `${projectId}-${sanitizedVersion}`;
}

/**
 * Converts a version string to a valid service account name
 * Ensures compliance with GCP SA naming restrictions
 * @param {string} version - Version name
 * @returns {string} Valid service account ID
 */
function toServiceAccountId(version) {
  return `${version.toLowerCase()}-sa`;
}

/**
 * Generates the full service URL for a deployed version
 * @param {Object} config
 * @param {string} config.projectId - GCP project ID
 * @param {string} config.version - Version name
 * @param {string} config.region - GCP region
 * @returns {string} Full service URL
 */
function getServiceUrl({ projectId, version, region }) {
  const serviceName = toServiceName({ projectId, version });
  return `https://${serviceName}-${region}.run.app`;
}

/**
 * Validates version name constraints
 * @param {string} version - Version name to validate
 * @returns {boolean} True if valid
 * @throws {Error} If version name is invalid
 */
function validateVersionName(version) {
  if (version.length < 1 || version.length > 20) {
    throw new Error('Version name must be between 1 and 20 characters');
  }
  if (!/^[a-zA-Z][-a-zA-Z0-9]*$/.test(version)) {
    throw new Error('Version name must start with a letter and contain only letters, numbers, and hyphens');
  }
  const serviceAccountId = toServiceAccountId(version);
  if (serviceAccountId.length < 6 || serviceAccountId.length > 30) {
    throw new Error('Version name would result in invalid service account ID length');
  }
  return true;
}

/**
 * Ensures Google Cloud setup is complete for deployment
 * @param {string} projectId - GCP project ID
 * @param {string} version - Version name
 * @returns {Promise<void>}
 */
async function ensureGoogleCloudSetup(projectId, version) {
  console.log('Ensuring Google Cloud setup...');

  // Get project number
  console.log('Getting project number...');
  const projectNumber = execSync(
    `gcloud projects describe ${projectId} --format="value(projectNumber)"`,
    { encoding: 'utf8' }
  ).trim();

  // Get Cloud Build service account
  const buildServiceAccount = `${projectNumber}@cloudbuild.gserviceaccount.com`;
  console.log(`Project ID: ${projectId}`);
  console.log(`Project Number: ${projectNumber}`);
  console.log(`Cloud Build Service Account: ${buildServiceAccount}`);

  console.log('\nGranting necessary permissions to Cloud Build service account...');

  // Grant necessary permissions
  const roles = [
    'roles/iam.serviceAccountUser',
    'roles/iam.securityAdmin',
    'roles/run.admin',
    'roles/run.developer',
    'roles/run.invoker'
  ];

  for (const role of roles) {
    try {
      execSync(
        `gcloud projects add-iam-policy-binding ${projectId} \
        --member="serviceAccount:${buildServiceAccount}" \
        --role="${role}"`,
        { stdio: 'inherit' }
      );
      console.log(`✓ Granted ${role}`);
    } catch (error) {
      console.error(`Failed to grant ${role}. You may need to run this command manually with higher permissions.`);
      throw error;
    }
  }
  console.log('');
}

/**
 * Grants public access to the deployed service
 * @param {string} projectId - GCP project ID
 * @param {string} version - Version name
 * @returns {Promise<void>}
 */
async function grantPublicAccess(projectId, version) {
  const serviceName = toServiceName({ projectId, version });
  console.log(`\nGranting public access to ${serviceName}...`);

  try {
    execSync(
      `gcloud run services add-iam-policy-binding ${serviceName} \
      --member="allUsers" \
      --role="roles/run.invoker" \
      --region=us-central1`,
      { stdio: 'inherit' }
    );
    console.log('✓ Granted public access to Cloud Run service');
  } catch (error) {
    console.error('Failed to grant public access:', error.message);
    console.error('You may need to run this command manually:');
    console.error(
      `gcloud run services add-iam-policy-binding ${serviceName} \
      --member="allUsers" \
      --role="roles/run.invoker" \
      --region=us-central1`
    );
  }
}

/**
 * Generates necessary deployment files
 * @param {string} version - Version name
 * @param {string} projectId - GCP project ID
 * @returns {Promise<void>}
 */
async function generateDeploymentFiles(version, projectId) {
  console.log('\nGenerating deployment files...');

  const { cloudbuild, shellUtils } = await processCloudBuildTemplate({
    version,
    region: 'us-central1',
    repository: 'cloud-run-source-deploy',
    projectId
  });
  console.log('✓ Generated cloudbuild.yaml');

  const dockerfile = await processDockerfileTemplate();
  console.log('✓ Generated Dockerfile');

  const nextConfig = processNextConfig({
    baseConfig: {
      output: 'standalone'
    }
  });

  // Write all files
  await fs.mkdir('workspace', { recursive: true });
  const files = {
    'cloudbuild.yaml': cloudbuild,
    'cht-utils.sh': shellUtils,
    'Dockerfile': dockerfile,
    'next.config.js': nextConfig
  };

  // Write to workspace and copy to root
  for (const [filename, content] of Object.entries(files)) {
    const workspacePath = `workspace/${filename}`;
    await fs.writeFile(workspacePath, content);
    await fs.copyFile(workspacePath, filename);

    // Set executable permission for shell script
    if (filename.endsWith('.sh')) {
      await fs.chmod(filename, 0o755);
    }
  }
  console.log('✓ Wrote deployment files\n');
}

module.exports = {
  toServiceName,
  toServiceAccountId,
  getServiceUrl,
  validateVersionName,
  ensureGoogleCloudSetup,
  grantPublicAccess,
  generateDeploymentFiles
};
