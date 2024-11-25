const deployUtils = require('./utils/deploy-utils');
const serviceAccountUtils = require('./utils/service-account-utils');
const resourceUtils = require('./utils/resource-utils');
const { processCloudBuildTemplate } = require('./build/cloudbuild-processor');
const { processDockerfileTemplate } = require('./build/dockerfile-processor');
const { processNextConfig } = require('./build/next-config-processor');
const { generateShellUtils, writeShellUtils } = require('./build/shell-utils-generator');

module.exports = {
  ...deployUtils,
  ...serviceAccountUtils,
  ...resourceUtils,
  processCloudBuildTemplate,
  processDockerfileTemplate,
  processNextConfig,
  generateShellUtils,
  writeShellUtils
};
