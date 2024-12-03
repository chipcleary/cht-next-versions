async function getConfig() {
  const { initializeSecretManager, secretExists } = await import('@cht/next-versions').then(
    (mod) => mod
  );
  const { getAppConfigSecret, getAppConfigSecretName } = await import(
    './src/config/secrets.js'
  ).then((mod) => mod);

  return {
    hooks: {
      // Setup Secret Manager access before deployment
      validateEnvironment: async (context) => {
        const { projectId, version } = context;
        console.log('\n=== Start hook: validateEnvironment ===');
        console.log('CONFIG HOOK: Setting up Secret Manager access...');
        await initializeSecretManager(projectId);
        const secretName = getAppConfigSecretName(version);
        console.log(`CONFIG HOOK: Validate that secret '${secretName}' exists...`);
        if (!(await secretExists(projectId, secretName))) {
          throw new Error(
            `Secret ${secretName} not found. Create it with:\n` +
              `gcloud secrets create ${secretName} --replication-policy="automatic"\n` +
              `echo '{your-config-json}' | gcloud secrets versions add ${secretName} --data-file=-`
          );
        }
        console.log(`✔️ Secret '${secretName}' exists`);
        console.log('=== End hook: validateEnvironment ===\n');
      },

      // Inject config into Next.js env
      configureNextConfig: async (config, context) => {
        const { projectId, version } = context;
        console.log('\n=== Start hook: configureNextConfig ===');
        const secretName = getAppConfigSecretName(version);
        console.log(`CONFIG HOOK: Retrieving secret '${secretName}'...`);
        const appConfig = await getAppConfigSecret(projectId, version);
        console.log('CONFIG HOOK: Retrieved secret config successfully');
        console.log('CONFIG HOOK: config:', appConfig);
        console.log('=== End hook: configureNextConfig ===\n');
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
}

module.exports = getConfig();
