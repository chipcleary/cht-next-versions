/** @type {import('@cht/next-versions').Config} */
module.exports = {
  // Override default region if needed
  // region: 'us-central1',

  // Override default repository if needed
  // repository: 'cloud-run-source-deploy',

  // Add deployment hooks
  hooks: {
    // Run after successful deployment
    postDeploy: async (version, url) => {
      console.log(`\nCustom post-deploy steps for version ${version}`);
      console.log(`Service deployed to: ${url}`);

      // Add your custom post-deployment logic here
      // Examples:
      // - Notify team on Slack
      // - Update DNS records
      // - Run smoke tests
      // - etc.
    }
  }
};
