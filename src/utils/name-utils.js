/**
 * Utilities for GCP resource naming and validation
 */

/**
 * Validates and sanitizes a version name for use in GCP resources
 * @param {string} version - Raw version name
 * @returns {string} Sanitized version name
 * @throws {Error} If version name is invalid
 */
export function sanitizeVersionName(version) {
  if (!version) {
    throw new Error('Version name is required');
  }

  // Convert to lowercase and replace invalid characters
  const sanitized = version.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  // Must start with a letter
  if (!/^[a-z]/.test(sanitized)) {
    throw new Error('Version name must start with a letter');
  }

  // Check length constraints (Cloud Run has stricter limits than general GCP)
  if (sanitized.length < 1 || sanitized.length > 20) {
    throw new Error('Version name must be between 1 and 20 characters');
  }

  return sanitized;
}

/**
 * Generates Cloud Run service name
 * @param {Object} config - Configuration object
 * @param {string} config.projectId - GCP project ID
 * @param {string} config.version - Version name
 * @returns {string} Valid Cloud Run service name
 * @throws {Error} If resulting service name would be invalid
 */
export function getCloudRunServiceName(config) {
  if (!config.projectId) throw new Error('Project ID is required');

  const { projectId, version } = config;
  if (projectId.length > 30) {
    throw new Error(`Project ID "${projectId}" exceeds 30 characters`);
  }

  const sanitizedVersion = sanitizeVersionName(version);
  const serviceName = `${projectId}-${sanitizedVersion}`;

  // Cloud Run service names must be <= 63 characters
  if (serviceName.length > 63) {
    throw new Error(
      `Service name "${serviceName}" exceeds 63 characters. ` +
        `Consider using a shorter project ID (${projectId.length} chars) ` +
        `or version name (${sanitizedVersion.length} chars).`
    );
  }

  return serviceName;
}

/**
 * Gets service account email for the given project
 * @param {string} projectNumber - GCP project number
 * @returns {string} Service account email
 */
export function getComputeServiceAccountEmail(projectNumber) {
  return `${projectNumber}-compute@developer.gserviceaccount.com`;
}

/**
 * Generates Docker image path for Artifact Registry
 * @param {Object} config - Configuration object
 * @param {string} config.projectId - GCP project ID
 * @param {string} config.version - Version name
 * @param {string} config.region - GCP region
 * @param {string} config.repository - Artifact Registry repository name
 * @returns {string} Full Docker image path
 */
export function getDockerImagePath(config) {
  const { projectId, version, region, repository } = config;
  const sanitizedVersion = sanitizeVersionName(version);
  return `${region}-docker.pkg.dev/${projectId}/${repository}/${sanitizedVersion}`;
}

/**
 * Validates all resource names for a given configuration
 * @param {Object} config - Configuration object
 * @param {string} config.projectId - GCP project ID
 * @param {string} config.version - Version name
 * @param {string} config.region - GCP region
 * @param {string} config.repository - Artifact Registry repository
 * @returns {Object} Validated resource names
 * @throws {Error} If any resource names are invalid
 */
export function validateResourceNames(config) {
  const { projectId, version, region, repository } = config;

  if (!projectId) throw new Error('Project ID is required');
  if (!version) throw new Error('Version is required');
  if (!region) throw new Error('Region is required');
  if (!repository) throw new Error('Repository is required');

  return {
    version: sanitizeVersionName(version),
    serviceName: getCloudRunServiceName({ projectId, version }),
    imageUrl: getDockerImagePath({ projectId, version, region, repository }),
    serviceUrl: getServiceUrl({ projectId, version, region }),
  };
}
