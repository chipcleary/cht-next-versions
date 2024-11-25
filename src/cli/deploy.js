const { loadConfig } = require('./config');
const {
  ensureGoogleCloudSetup,
  grantPublicAccess,
  generateDeploymentFiles
} = require('../utils/deploy-utils');
const fs = require('fs/promises');
const { execSync } = require('child_process');

async function ensureDirectories() {
  const dirs = ['public', '.next/standalone', '.next/static', 'workspace'];
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * Deploy a version of the application
 * @param {string} version Version name to deploy
 */
async function deploy(version) {
  if (!version) {
    throw new Error('Version argument is required\nUsage: deploy <version>\nExample: deploy staging');
  }

  try {
    console.log(`Deploying version: ${version}`);

    // Load configuration
    const config = await loadConfig();

    // Get project ID from gcloud
    const projectId = execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
    if (!projectId) {
      throw new Error('No Google Cloud project configured. Run: gcloud config set project YOUR_PROJECT_ID');
    }

    // Create required directories
    await ensureDirectories();

    // Setup Google Cloud (IAM, etc.)
    await ensureGoogleCloudSetup(projectId, version);

    // Generate deployment files
    await generateDeploymentFiles(version, projectId, config);

    // Run deployment
    console.log('\nStarting deployment...');
    execSync('gcloud beta builds submit --config=cloudbuild.yaml', { stdio: 'inherit' });

    // Post-deployment setup
    await grantPublicAccess(projectId, version);

    // Get actual service URL from Cloud Run
    const url = execSync(
      `gcloud run services describe ${projectId}-${version} --region=${config.region} --format="value(status.url)"`,
      { encoding: 'utf8' }
    ).trim();

    // Run post-deploy hook if configured
    if (config.hooks?.postDeploy) {
      console.log('\nRunning post-deploy hook...');
      await config.hooks.postDeploy(version, url);
    }

    console.log(`\nDeployment complete!`);
    console.log(`Service URL: ${url}`);
  } catch (error) {
    console.error('\nDeployment failed:', error.message);
    process.exit(1);
  }
}

module.exports = { deploy };
