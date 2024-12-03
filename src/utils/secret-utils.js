import { getProjectNumber, setIamPolicyBinding, executeGCloudCommand } from './gcloud-utils.js';
import { getComputeServiceAccountEmail } from './name-utils.js';
import { logger } from '../logging/logger.js';

/**
 * Sets up Secret Manager for the project
 * @param {string} projectId - GCP project ID
 * @returns {Promise<void>}
 */
export async function initializeSecretManager(projectId) {
  try {
    // Enable Secret Manager API
    await executeGCloudCommand({
      args: ['services', 'enable', 'secretmanager.googleapis.com', `--project=${projectId}`],
    });

    // Get project number and set up service account
    const projectNumber = await getProjectNumber(projectId);
    const buildServiceAccount = getComputeServiceAccountEmail(projectNumber);

    // Grant Secret Manager access using setIamPolicyBinding
    await setIamPolicyBinding({
      projectId,
      member: `serviceAccount:${buildServiceAccount}`,
      role: 'roles/secretmanager.secretAccessor',
    });

    logger.info('✓ Secret Manager setup complete');
  } catch (error) {
    logger.error(`Secret Manager setup failed: ${error.message}`);
    throw error;
  }
}

/**
 * Checks whether a secret exists
 * *@param {string} config.projectId - GCP project ID
 * @param {string} config.secretName - Secret name
 * @returns {Promise<boolean>} True if secret exists, false otherwise
 */
export async function secretExists(projectId, secretName) {
  try {
    await executeGCloudCommand({
      args: ['secrets', 'describe', secretName, `--project=${projectId}`, '--format=json'],
      options: { silent: true, returnOutput: true },
    });
    return true;
  } catch (error) {
    if (error.message.includes('NOT_FOUND')) {
      return false;
    }
    throw error;
  }
}

/** Retrieves a secret's value
 * @param {string} projectId - GCP project ID
 * @param {string} secretName - Secret name
 * @param {boolean} validateExists - Whether to validate that the secret exists before retrieving it
 * @returns {Promise<Object>} Parsed secret value
 * Note: assumes that the secret exists. Can use checkSecretExists beforehand to validate.
 */
export async function getSecret(projectId, secretName, validateExists = true) {
  if (validateExists) {
    logger.debug(`(getSecretConfig): Validate secret ${secretName} exists`);
    if (!(await secretExists(projectId, secretName))) {
      throw new Error(
        `Secret ${secretName} not found. Create it with:\n` +
          `gcloud secrets create ${secretName} --replication-policy="automatic"\n` +
          `echo '{your-config-json}' | gcloud secrets versions add ${secretName} --data-file=-`
      );
    }
  }
  try {
    logger.debug(`(getSecretConfig): Attempting to access secret ${secretName}`);
    const secretValue = await executeGCloudCommand({
      args: [
        'secrets',
        'versions',
        'access',
        'latest',
        `--secret=${secretName}`,
        `--project=${projectId}`,
      ],
      options: { silent: true, returnOutput: true },
    });
    logger.debug('(getSecretConfig): Successfully accessed secret');
    return secretValue;
  } catch (error) {
    logger.error(`(getSecretConfig): Error accessing secret: ${error.message}`);
    throw error;
  }
}

/**
 * Validates a secret value using a provided validation function
 * @param {string} secretValue - Secret value to validate
 * @param {Function} validationFunction - Function used to validate the secret value
 * @returns {boolean} - True if the validation works, false otherwise
 */
export function validateSecret(secretValue, validationFunction) {
  try {
    validationFunction(secretValue);
    return true;
  } catch (error) {
    return false;
  }
}
