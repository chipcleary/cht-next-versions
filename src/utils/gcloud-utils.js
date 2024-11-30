import { executeCommand } from './process-utils.js';
import { logger } from '../logging/logger.js';

/**
 * Gets project number for a project
 * @param {string} projectId - GCP project ID
 * @returns {Promise<string>} Project number
 */
export async function getProjectNumber(projectId) {
  const result = await executeGCloudCommand({
    args: ['projects', 'describe', projectId, '--format="value(projectNumber)"'],
    options: {
      silent: true,
      returnOutput: true,
    },
  });

  if (!result) {
    throw new Error(`Could not get project number for ${projectId}`);
  }

  return result;
}

/**
 * Waits for a resource to be ready
 * @param {Object} config - Configuration object
 * @param {string} config.type - Resource type (e.g., 'service', 'secret')
 * @param {string} config.name - Resource name
 * @param {Object} config.params - Additional parameters for the check
 * @param {number} [config.maxAttempts=5] - Maximum number of attempts
 * @param {number} [config.delayMs=2000] - Delay between attempts
 * @returns {Promise<void>}
 */
export async function waitForResourceReady({
  type,
  name,
  params = {},
  maxAttempts = 5,
  delayMs = 2000,
}) {
  const typeConfig = {
    service: {
      command: ['run', 'services', 'describe'],
      readyCheck: (output) => output.includes('status.url'),
    },
    secret: {
      command: ['secrets', 'describe'],
      readyCheck: (output) => output.includes('name'),
    },
  }[type];

  if (!typeConfig) {
    throw new Error(`Unsupported resource type: ${type}`);
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await executeGCloudCommand({
        args: [
          ...typeConfig.command,
          name,
          ...Object.entries(params).map(([k, v]) => `--${k}=${v}`),
          '--format=json',
        ],
        options: { silent: true, returnOutput: true },
      });

      if (typeConfig.readyCheck(result)) {
        return;
      }
    } catch (error) {
      if (attempt === maxAttempts) {
        throw new Error(
          `Resource ${name} not ready after ${maxAttempts} attempts: ${error.message}`
        );
      }
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

/**
 * Executes a gcloud command and handles common error patterns
 * @param {Object} config - Command configuration
 * @param {string[]} config.args - Command arguments
 * @param {Object} [config.options] - Command options
 * @param {boolean} [config.options.silent=false] - Whether to suppress output
 * @param {boolean} [config.options.returnOutput=false] - Whether to return command output
 * @returns {Promise<string|void>} Command output if returnOutput is true
 * @throws {Error} If command fails
 */
export async function executeGCloudCommand({ args, options = {} }) {
  logger.debug('(executeGCloudCommand) Input args:', args);
  logger.debug('(executeGCloudCommand) Input options:', options);

  const { silent = false, returnOutput = false } = options;

  const command = `gcloud ${args.join(' ')}`;
  logger.debug(`(executeGCloudCommand) Constructed command: ${command}`);

  try {
    // If we don't need the output, just execute
    if (!returnOutput) {
      logger.debug('(executeGCloudCommand) Executing command without returning output');
      executeCommand(command, { silent });
      return;
    }

    // Only try to process output if we explicitly need it
    logger.debug('(executeGCloudCommand) Executing command with output capture');
    const result = executeCommand(command, { silent });

    const trimmedResult = result ? result.trim() : '';
    return trimmedResult;
  } catch (error) {
    logger.error(`(executeGCloudCommand) Error caught: ${error.message}`);
    throw new Error(`Google Cloud command failed: ${error.message}`);
  }
}

/**
 * Sets IAM policy binding
 * @param {Object} config - Configuration object
 * @param {string} config.projectId - GCP project ID
 * @param {string} config.member - Member to grant role to
 * @param {string} config.role - Role to grant
 * @returns {Promise<void>}
 */
export async function setIamPolicyBinding({ projectId, member, role }) {
  // First check if binding already exists
  try {
    const policy = await executeGCloudCommand({
      args: ['projects', 'get-iam-policy', projectId, '--format=json'],
      options: {
        silent: true,
        returnOutput: true,
      },
    });

    const currentPolicy = JSON.parse(policy);
    const hasBinding = currentPolicy.bindings?.some(
      (binding) => binding.role === role && binding.members?.includes(member)
    );

    if (hasBinding) {
      logger.debug(`✓ Role ${role} already granted to ${member}`);
      return;
    }

    // If not already bound, add it
    await executeGCloudCommand({
      args: [
        'projects',
        'add-iam-policy-binding',
        projectId,
        `--member=${member}`,
        `--role=${role}`,
      ],
      options: {
        silent: false,
        returnOutput: false,
      },
    });
    logger.debug(`✓ Role ${role} granted to ${member}`);
  } catch (error) {
    throw new Error(`Failed to set IAM binding: ${error.message}`);
  }
}

/**
 * Sets Cloud Run IAM policy
 * @param {Object} config - Configuration object
 * @param {string} config.serviceName - Cloud Run service name
 * @param {string} config.member - Member to grant access to
 * @param {string} config.role - Role to grant
 * @param {string} config.region - GCP region
 * @param {string} config.projectId - GCP project ID
 * @returns {Promise<void>}
 */
export async function setCloudRunIamPolicy({ serviceName, member, role, region, projectId }) {
  await executeGCloudCommand({
    args: [
      'run',
      'services',
      'add-iam-policy-binding',
      serviceName,
      `--member="${member}"`,
      `--role="${role}"`,
      `--region=${region}`,
      `--project=${projectId}`,
    ],
    options: { silent: false, returnOutput: false },
  });
}

/**
 * Gets Cloud Run IAM policy
 * @param {Object} config - Configuration object
 * @param {string} config.serviceName - Cloud Run service name
 * @param {string} config.region - GCP region
 * @param {string} config.projectId - GCP project ID
 * @returns {Promise<Object>} IAM policy
 */
export async function getCloudRunIamPolicy({ serviceName, region, projectId }) {
  const result = await executeGCloudCommand({
    args: [
      'run',
      'services',
      'get-iam-policy',
      serviceName,
      `--region=${region}`,
      `--project=${projectId}`,
      '--format=json',
    ],
    options: {
      silent: true,
      returnOutput: true,
    },
  });

  return result ? JSON.parse(result) : null;
}

/**
 * Checks if Cloud Run IAM binding exists
 * @param {Object} config - Configuration object
 * @param {string} config.serviceName - Cloud Run service name
 * @param {string} config.member - Member to check
 * @param {string} config.role - Role to check
 * @param {string} config.region - GCP region
 * @param {string} config.projectId - GCP project ID
 * @returns {Promise<boolean>} True if binding exists
 */
export async function hasCloudRunIamBinding({ serviceName, member, role, region, projectId }) {
  try {
    const policy = await getCloudRunIamPolicy({ serviceName, region, projectId });
    return (
      policy?.bindings?.some(
        (binding) => binding.role === role && binding.members?.includes(member)
      ) || false
    );
  } catch (error) {
    if (error.message.includes('NOT_FOUND')) {
      return false;
    }
    throw error;
  }
}

/**
 * Gets the deployed service URL
 * @param {Object} config - Configuration object
 * @param {string} config.serviceName - Cloud Run service name
 * @param {string} config.region - GCP region
 * @param {string} config.projectId - GCP project ID
 * @returns {Promise<string>} Service URL
 */
export async function getDeployedServiceUrl({ serviceName, region, projectId }) {
  const result = await executeGCloudCommand({
    args: [
      'run',
      'services',
      'describe',
      serviceName,
      `--region=${region}`,
      `--project=${projectId}`,
      '--format="value(status.url)"',
    ],
    options: {
      silent: true,
      returnOutput: true,
    },
  });

  if (!result) {
    throw new Error(`Could not get URL for service ${serviceName}`);
  }

  return result;
}
