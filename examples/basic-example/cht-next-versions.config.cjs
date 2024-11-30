/** @type {import('@cht/next-versions').Config} */
module.exports = {
  region: 'us-central1',
  repository: 'cloud-run-source-deploy',
  hooks: {
    // Environment validation hook
    validateEnvironment: async (context) => {
      console.log('\n=== Start validateEnvironment Hook ===');
      console.log('Received context:', context);
      // More defensive handling of context
      if (context) {
        const { projectId, version, region, repository } = context;
        console.log('Available values:');
        if (projectId) console.log('Project ID:', projectId);
        if (version) console.log('Version:', version);
        if (region) console.log('Region:', region);
        if (repository) console.log('Repository:', repository);
      } else {
        console.log('No context received');
      }
      console.log('=== End validateEnvironment Hook ===\n');
    },

    // Next.js config hook
    configureNextConfig: async (config, context) => {
      console.log('\n=== Start configureNextConfig Hook ===');
      console.log('Base config:', config);
      console.log('Received context:', context);

      console.log('=== End configureNextConfig Hook ===\n');
      // Base modification without requiring context
      return {
        ...config,
        env: {
          ...config.env,
          DEPLOYMENT_TIME: new Date().toISOString(),
        },
      };
    },

    // Final post-deploy hook
    postDeploy: async (version, url) => {
      console.log('\n=== Start postDeploy Hook ===');
      console.log('Received values:', { version, url });
      console.log('Deployment completed at:', new Date().toISOString());
      console.log('=== End postDeploy Hook ===\n');
    },
  },
};
