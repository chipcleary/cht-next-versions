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

module.exports = {
  toServiceName,
  toServiceAccountId,
  getServiceUrl,
  validateVersionName
};
