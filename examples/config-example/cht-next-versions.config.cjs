const { setupSecretManager, getSecretConfig } = require('@cht/next-versions/utils');

module.exports = {
  hooks: {
    // Setup Secret Manager access before deployment
    validateEnvironment: async (context) => {
      const { projectId, version } = context;
      console.log('CONFIG HOOK: Starting validateEnvironment');
      console.log('CONFIG HOOK: Setting up Secret Manager access...');
      await setupSecretManager(projectId);
      console.log('CONFIG HOOK: Attempting to get secret config...');
      await getSecretConfig({ projectId, version });
      console.log('CONFIG HOOK: validateEnvironment complete');
    },

    // Inject config into Next.js env
    configureNextConfig: async (config, { version, projectId }) => {
      console.log('CONFIG HOOK: Starting configureNextConfig');
      console.log(`CONFIG HOOK: Getting secret for version ${version}...`);
      const appConfig = await getSecretConfig({ projectId, version });
      console.log('CONFIG HOOK: Got secret config successfully');
      return {
        ...config,
        env: {
          ...config.env,
          APP_CONFIG: appConfig,
        },
      };
    },
  },
};
