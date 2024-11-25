#!/usr/bin/env node
const { processCloudBuildTemplate, processDockerfileTemplate, processNextConfig } = require('@cht/next-versions');
const fs = require('fs/promises');
const { execSync } = require('child_process');

async function ensureGoogleCloudSetup(projectId, version) {
  console.log('Ensuring Google Cloud setup...');

  // Get project number
  console.log('Getting project number...');
  const projectNumber = execSync(
    `gcloud projects describe ${projectId} --format="value(projectNumber)"`,
    { encoding: 'utf8' }
  ).trim();

  // Get Cloud Build service account
  const buildServiceAccount = `${projectNumber}@cloudbuild.gserviceaccount.com`;

  console.log(`Project ID: ${projectId}`);
  console.log(`Project Number: ${projectNumber}`);
  console.log(`Cloud Build Service Account: ${buildServiceAccount}`);
  console.log('\nGranting necessary permissions to Cloud Build service account...');

  // Grant necessary permissions
  const roles = [
    'roles/run.admin',           // Allows Cloud Run admin
    'roles/iam.serviceAccountUser', // Allows using service accounts
    'roles/iam.securityAdmin',    // Allows setting IAM policies
    'roles/run.invoker'          // Allows invoking Cloud Run services
  ];

  for (const role of roles) {
    try {
      execSync(
        `gcloud projects add-iam-policy-binding ${projectId} \\
        --member="serviceAccount:${buildServiceAccount}" \\
        --role="${role}"`,
        { stdio: 'inherit' }
      );
      console.log(`✓ Granted ${role}`);
    } catch (error) {
      console.error(`Failed to grant ${role}. You may need to run this command manually with higher permissions.`);
      throw error;
    }
  }

  console.log('');
}

async function grantPublicAccess(projectId, version) {
  const serviceName = `${projectId}-${version}`;
  console.log(`\nGranting public access to ${serviceName}...`);
  try {
    execSync(
      `gcloud run services add-iam-policy-binding ${serviceName} \\
      --member="allUsers" \\
      --role="roles/run.invoker" \\
      --region=us-central1`,
      { stdio: 'inherit' }
    );
    console.log('✓ Granted public access to Cloud Run service');
  } catch (error) {
    console.error('Failed to grant public access:', error.message);
    console.error('You may need to run this command manually:');
    console.error(`gcloud run services add-iam-policy-binding ${serviceName} \\
      --member="allUsers" \\
      --role="roles/run.invoker" \\
      --region=us-central1`);
  }
}

async function generateDeploymentFiles(version, projectId) {
  console.log('\nGenerating deployment files...');

  // Generate deployment files
  const { cloudbuild, shellUtils } = await processCloudBuildTemplate({
    version,
    region: 'us-central1',
    repository: 'cloud-run-source-deploy',
    projectId
  });
  console.log('✓ Generated cloudbuild.yaml');

  const dockerfile = await processDockerfileTemplate();
  console.log('✓ Generated Dockerfile');

  // Create next.config.js
  const nextConfig = processNextConfig({
    baseConfig: {
      output: 'standalone'
    }
  });

  // Write all files
  await fs.mkdir('workspace', { recursive: true });

  const files = {
    'cloudbuild.yaml': cloudbuild,
    'cht-utils.sh': shellUtils,
    'Dockerfile': dockerfile,
    'next.config.js': nextConfig
  };

  // Write to workspace and copy to root
  for (const [filename, content] of Object.entries(files)) {
    const workspacePath = `workspace/${filename}`;
    await fs.writeFile(workspacePath, content);
    await fs.copyFile(workspacePath, filename);

    // Set executable permission for shell script
    if (filename.endsWith('.sh')) {
      await fs.chmod(filename, 0o755);
    }
  }

  console.log('✓ Wrote deployment files\n');
}

async function deploy() {
  try {
    // Ensure version is provided
    const version = process.argv[2];
    if (!version) {
      console.error('Error: Version argument is required');
      console.error('Usage: npm run deploy <version>');
      console.error('Example: npm run deploy staging');
      process.exit(1);
    }

    // Get project ID from gcloud
    const projectId = execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
    if (!projectId) {
      console.error('Error: No Google Cloud project configured');
      console.error('Run: gcloud config set project YOUR_PROJECT_ID');
      process.exit(1);
    }

    // Ensure Google Cloud setup
    await ensureGoogleCloudSetup(projectId, version);

    console.log(`Deploying version: ${version}`);
    console.log(`Project ID: ${projectId}`);

    // Generate deployment files
    await generateDeploymentFiles(version, projectId);

    console.log('Running deployment...');

    // Execute deployment with build logging
    execSync('gcloud beta builds submit --config=cloudbuild.yaml', { stdio: 'inherit' });

    // Grant public access after deployment
    await grantPublicAccess(projectId, version);

    console.log('Deployment complete!');
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

deploy();
