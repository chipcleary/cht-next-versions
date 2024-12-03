/** * Gets secret name for a version * @param {string} version - Deployment version * @returns {string} Secret name */ export function getAppConfigSecretName(
  version
) {
  const formattedVersion = version.replace(/-/g, '_').toUpperCase();
  return `APP_CONFIG_${formattedVersion}`;
}

/**
 * Parses the secret's JSON
 * @param {string} secretValue - Secret value to validate
 * @returns {Object} Parsed secret value
 * @throws {Error} If secret is invalid JSON
 */
export function parseSecret(secretValue) {
  console.log('(parseSecret) secretValue:', secretValue);
  try {
    return JSON.parse(secretValue);
  } catch (error) {
    throw new Error(`Invalid secret format: must be valid JSON\n${error.message}`);
  }
}
