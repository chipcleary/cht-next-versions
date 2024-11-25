/**
 * Defines hook points for the deployment process
 */

const defaultHooks = {
  /**
   * Called before any deployment steps begin
   * @param {Object} context Deployment context
   * @returns {Array} Additional steps to insert at the start
   */
  beforeDeploy: (context) => [],

  /**
   * Called after environment validation, before build
   * @param {Object} context Deployment context
   * @returns {Array} Additional steps to insert before build
   */
  beforeBuild: (context) => [],

  /**
   * Called after build, before service deployment
   * @param {Object} context Deployment context
   * @returns {Array} Additional steps to insert before service deployment
   */
  beforeServiceDeploy: (context) => [],

  /**
   * Called after successful deployment
   * @param {Object} context Deployment context
   * @returns {Array} Additional steps to run after deployment
   */
  afterDeploy: (context) => []
};

/**
 * Creates a hooks manager for the deployment process
 * @param {Object} customHooks User-provided hooks to merge with defaults
 * @returns {Object} Complete hooks object
 */
function createHooks(customHooks = {}) {
  return {
    ...defaultHooks,
    ...customHooks
  };
}

module.exports = {
  defaultHooks,
  createHooks
};
