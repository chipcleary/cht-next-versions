const yaml = require('yaml');
async function getConfig() {
  const { initializeSecretManager, secretExists } = await import(
    '@chipcleary/cht-next-versions'
  ).then((mod) => mod);

  const { getAppConfigSecret } = await import('./src/config/secrets-server.js').then((mod) => mod);

  const { getAppConfigSecretName } = await import('./src/config/secrets-client.js').then(
    (mod) => mod
  );

  return {
    shellUtilHooks: {
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
    },
    cloudBuildHooks: {
      beforeServiceDeploy: async (context) => {
        const { projectId, version } = context;
        console.log('\n=== Start hook: beforeServiceDeploy ===');
        const appConfig = await getAppConfigSecret(projectId, version);
        const parsedConfig = JSON.parse(appConfig);

        const runtimeEnvVars = Object.entries(parsedConfig)
          .filter(([key]) => !key.startsWith('NEXT_PUBLIC_'))
          .reduce((acc, [key, value]) => `${acc}${acc ? ',' : ''}${key}=${value}`, '');

        console.log('CONFIG HOOK: runtime key:value pairs:', runtimeEnvVars);
        console.log('=== End hook: beforeServiceDeploy ===\n');

        const step = {
          name: 'gcr.io/cloud-builders/gcloud',
          id: 'setup-runtime-env',
          entrypoint: 'bash',
          args: [
            '-c',
            `
            # Extracting and setting runtime environment variables
            appConfig=$(gcloud secrets versions access latest --secret="your-secret-name")
            parsedConfig=$(echo "$appConfig" | jq -r 'to_entries | map("\\(.key)=\\(.value|tostring)") | .[]')
            echo "$parsedConfig" | while read line; do
                if [[ $line != NEXT_PUBLIC_* ]]; then
                    echo "export $line" >> /workspace/runtime-env.sh
                fi
            done
            source /workspace/runtime-env.sh
            `,
          ],
          secretEnv: ['GITHUB_PACKAGES_TOKEN'],
        };

        const yamlStep = yaml.stringify(step);
        return yamlStep;
      },
    },
    nextConfigHooks: {
      configureNextConfig: async (config, context) => {
        const { projectId, version } = context;
        console.log('\n=== Start hook: configureNextConfig ===');
        const secretName = getAppConfigSecretName(version);
        console.log(`CONFIG HOOK: Retrieving secret '${secretName}'...`);
        const appConfig = await getAppConfigSecret(projectId, version);
        console.log('CONFIG HOOK: Retrieved secret config successfully');
        console.log('CONFIG HOOK: appConfig JSON:', appConfig);
        const parsedConfig = JSON.parse(appConfig);
        console.log('CONFIG HOOK: parsedConfig:', parsedConfig);

        const envPublicVars = Object.entries(parsedConfig)
          .filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
          .reduce(
            (acc, [key, value]) => ({
              ...acc,
              [key]: value,
            }),
            {}
          );

        console.log('CONFIG HOOK: public key:value pairs:', envPublicVars);
        console.log('=== End hook: configureNextConfig ===\n');

        return {
          ...config,
          env:
            process.env.NODE_ENV === 'development'
              ? {}
              : {
                  ...config.env,
                  ...envPublicVars,
                  APP_VERSION: version,
                },
        };
      },
    },
  };
}

module.exports = getConfig();
