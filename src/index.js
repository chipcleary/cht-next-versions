const deployUtils = require('./utils/deploy-utils');
const serviceAccountUtils = require('./utils/service-account-utils');
const resourceUtils = require('./utils/resource-utils');
const { processCloudBuildTemplate } = require('./build/cloudbuild-processor');
const { processDockerfileTemplate } = require('./build/dockerfile-processor');
const { processNextConfig } = require('./build/next-config-processor');

module.exports = {
  ...deployUtils,
  ...serviceAccountUtils,
  ...resourceUtils,
  processCloudBuildTemplate,
  processDockerfileTemplate,
  processNextConfig
};
