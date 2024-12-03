import { getSecret } from '@chipcleary/cht-next-versions';
import { getAppConfigSecretName } from './secrets-client.js';

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
