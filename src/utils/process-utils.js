// src/utils/process-utils.js
import { execSync } from 'child_process';
import { logger } from '../logging/logger.js';

/**
 * Executes a shell command and returns the output
 * @param {string} command - Command to execute
 * @param {Object} [options] - Execution options
 * @param {boolean} [options.silent=false] - Suppress stdout/stderr
 * @param {string} [options.encoding='utf8'] - Output encoding
 * @returns {string} Command output
 * @throws {Error} If command fails
 */
export function executeCommand(command, options = {}) {
  const { silent = false, encoding = 'utf8' } = options;

  logger.debug(`(executeCommand) Starting execution of command: ${command}`);
  logger.debug('(executeCommand) options:', options);

  try {
    const output = execSync(command, {
      encoding,
      stdio: silent ? 'pipe' : 'inherit',
    });

    const trimmedOutput = silent ? output.toString(encoding).trim() : '';

    logger.debug(`(executeCommand) Completed execution of command: ${command}`);
    return trimmedOutput;
  } catch (error) {
    logger.error(`(executeCommand) Command failed: ${command}`);
    logger.debug(`(executeCommand) Error stack: ${error.stack}`);
    logger.error(`(executeCommand) Error message: ${error.message}`);
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

/**
 * Handles command execution errors with helpful messages
 * @param {Error} error - Error object
 * @param {Object} context - Error context
 * @param {string} context.command - Failed command
 * @param {string} context.help - Help message
 * @throws {Error} Enhanced error with context
 */
export function handleExecError(error, { command, help }) {
  const message = [`Command failed: ${command}`, error.message, '', 'Troubleshooting:', help].join(
    '\n'
  );
  throw new Error(message);
}
