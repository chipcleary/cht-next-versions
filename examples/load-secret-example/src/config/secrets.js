import { getSecret } from '@cht/next-versions';

/** Gets and validates a secret's value
 * @param {string} projectId - GCP project ID
 * @param {string} appVersion - Deployment version
 *@returns {Promise<Object>} Parsed secret value
 */
export async function getAppConfigSecret(projectId, appVersion) {
  const secretName = getAppConfigSecretName(appVersion);
  const secretValue = await getSecret(projectId, secretName);
  return secretValue;
}

/**
 * Gets secret name for a version
 * @param {string} version - Deployment version
 * @returns {string} Secret name
 */
export function getAppConfigSecretName(version) {
  return `APP_CONFIG_${version.toUpperCase()}`;
}

/**
 * Parses the secret's JSON
 * @param {string} secretValue - Secret value to validate
 * @returns {Object} Parsed secret value
 * @throws {Error} If secret is invalid JSON
 */
export function parseSecret(secretValue) {
  try {
    return JSON.parse(secretValue);
  } catch (error) {
    throw new Error(`Invalid secret format: must be valid JSON\n${error.message}`);
  }
}
