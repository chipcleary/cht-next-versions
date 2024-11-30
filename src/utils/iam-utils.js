// src/utils/iam-utils.js
import {
  getProjectNumber,
  executeGCloudCommand,
  setCloudRunIamPolicy,
  hasCloudRunIamBinding,
  waitForResourceReady,
} from './gcloud-utils.js';
import { getComputeServiceAccountEmail, getCloudRunServiceName } from './name-utils.js';
import { logger } from '../logging/logger.js';
/**
 * Required roles for user account
 * @type {string[]}
 */
export const USER_REQUIRED_ROLES = [
  'roles/iam.serviceAccountUser',
  'roles/iam.serviceAccountTokenCreator',
];

/**
 * Required roles for Cloud Build service account
 * @type {string[]}
 */
export const CLOUD_BUILD_REQUIRED_ROLES = [
  'roles/iam.serviceAccountUser',
  'roles/iam.securityAdmin',
  'roles/run.admin',
  'roles/run.developer',
  'roles/run.invoker',
  'roles/cloudbuild.builds.builder',
  'roles/iam.serviceAccountAdmin',
];

export async function validateGCloudPermissions(projectId) {
  logger.debug('(validateGCloudPermissions)Validating Google Cloud permissions...');
  try {
    // Get necessary identities
    const projectNumber = await getProjectNumber(projectId);
    const computeServiceAccount = getComputeServiceAccountEmail(projectNumber);
    const currentUser = await executeGCloudCommand({
      args: ['config', 'get-value', 'account'],
      options: { returnOutput: true, silent: true },
    });

    // Get IAM policy
    const policyJson = await executeGCloudCommand({
      args: ['projects', 'get-iam-policy', projectId, '--format=json'],
      options: { returnOutput: true, silent: true },
    });
    const policy = JSON.parse(policyJson);

    // Validate both user and service account permissions
    validatePermissions({
      policy,
      account: currentUser,
      accountType: 'user',
      requiredRoles: USER_REQUIRED_ROLES,
      displayName: 'User account',
    });

    validatePermissions({
      policy,
      account: computeServiceAccount,
      accountType: 'serviceAccount',
      requiredRoles: CLOUD_BUILD_REQUIRED_ROLES,
      displayName: 'Compute Engine service account',
    });

    logger.debug('✓ All required permissions are correctly set up');
  } catch (error) {
    if (error.message.includes('setup script')) {
      throw error; // Re-throw our formatted permission errors
    }
    throw new Error(
      'Failed to validate Google Cloud permissions:\n' +
        error.message +
        '\n\n' +
        'Please ensure you are logged in and have sufficient permissions:\n' +
        '$ gcloud auth login\n\n' +
        'Then run the setup script from the project README:\n' +
        '$ bash ./scripts/setup-gcloud-permissions.sh'
    );
  }
}

/**
 * Validates permissions for a specific identity
 * @param {Object} params - Parameters
 * @param {Object} params.policy - IAM policy object
 * @param {string} params.account - Account identifier without prefix (e.g., "example@gmail.com")
 * @param {string} params.accountType - Type of account ("user" or "serviceAccount")
 * @param {string[]} params.requiredRoles - Array of required roles
 * @param {string} params.displayName - Human-readable name for error messages (e.g., "User account" or "Cloud Build service account")
 * @throws {Error} If required permissions are missing
 */
function validatePermissions({ policy, account, accountType, requiredRoles, displayName }) {
  logger.debug(`Validating ${displayName} permissions...`);

  const member = `${accountType}:${account}`;
  const missingRoles = requiredRoles.filter((role) => {
    const hasRole = policy.bindings?.some(
      (binding) => binding.role === role && binding.members?.includes(member)
    );
    return !hasRole;
  });

  if (missingRoles.length > 0) {
    throw new Error(
      `${displayName} is missing required roles:\n` +
        missingRoles.join('\n') +
        '\n\n' +
        'Please run the setup script from the project README:\n' +
        '$ bash ./scripts/setup-gcloud-permissions.sh'
    );
  }
}

/**
 * Grants public access to Cloud Run service
 * @param {Object} config - Configuration object
 * @param {string} config.projectId - GCP project ID
 * @param {string} config.version - Version name
 * @param {string} config.region - GCP region
 * @returns {Promise<void>}
 */
export async function grantPublicAccess({ projectId, version, region }) {
  if (!projectId) throw new Error('projectId is required');
  if (!version) throw new Error('version is required');
  if (!region) throw new Error('region is required');

  logger.debug('(grantPublicAccess) Called with:', { projectId, version, region });
  const serviceName = getCloudRunServiceName({ projectId, version });

  try {
    // Wait for service to be ready before checking/setting IAM
    logger.debug('(grantPublicAccess) Waiting for service to be ready');
    await waitForResourceReady({
      type: 'service',
      name: serviceName,
      params: {
        region,
        project: projectId,
      },
    });

    // Check if binding already exists
    logger.debug('(grantPublicAccess) Checking existing binding');
    const hasBinding = await hasCloudRunIamBinding({
      serviceName,
      member: 'allUsers',
      role: 'roles/run.invoker',
      region,
      projectId,
    });

    if (hasBinding) {
      logger.debug('✓ Public access already granted');
      return true;
    }

    // Grant public access
    logger.debug('(grantPublicAccess) Setting IAM policy');
    await setCloudRunIamPolicy({
      serviceName,
      member: 'allUsers',
      role: 'roles/run.invoker',
      region,
      projectId,
    });

    logger.debug('✓ Granted public access to Cloud Run service');
    return true;
  } catch (error) {
    logger.error(`Failed to grant public access: ${error.message}`);
    throw error;
  }
}
