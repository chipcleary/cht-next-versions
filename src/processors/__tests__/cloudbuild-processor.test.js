import processCloudBuildTemplate from '../cloudbuild-processor';
import yaml from 'yaml';

describe('Cloud Build Processor', () => {
  test('processes template with required parameters', async () => {
    const result = await processCloudBuildTemplate({
      version: 'test',
      region: 'us-central1',
      repository: 'my-app-repo'
    });

    const config = yaml.parse(result.cloudbuild);
    expect(config.substitutions._APP_VERSION).toBe('test');
    expect(config.substitutions._REGION).toBe('us-central1');
    expect(config.substitutions._REPOSITORY).toBe('my-app-repo');

    // Check shell utils was generated
    expect(result.shellUtils).toContain('#!/bin/bash');
    expect(result.shellUtils).toContain('validate_environment()');
  });

  test('includes shell utility functions', async () => {
    const result = await processCloudBuildTemplate({
      version: 'test',
      region: 'us-central1',
      repository: 'my-app-repo'
    });

    // Check key functions exist
    expect(result.shellUtils).toContain('validate_environment()');
    expect(result.shellUtils).toContain('build_and_push_image()');
    expect(result.shellUtils).toContain('deploy_to_cloud_run()');
    expect(result.shellUtils).toContain('setup_service_account()');
  });

  test('includes source commands in cloudbuild steps', async () => {
    const result = await processCloudBuildTemplate({
      version: 'test',
      region: 'us-central1',
      repository: 'my-app-repo'
    });

    const config = yaml.parse(result.cloudbuild);
    const validateStep = config.steps.find(step => step.id === 'validate-environment');
    expect(validateStep.args[1]).toContain('source /workspace/cht-utils.sh');
  });

  test('throws error on missing required parameters', async () => {
    await expect(processCloudBuildTemplate({
      version: 'test',
      region: 'us-central1'
      // missing repository
    })).rejects.toThrow('repository is required');
  });

  test('processes hook functions correctly', async () => {
    const hooks = {
      validateEnvironment: () => '# Custom validation\necho "Custom validation step"',
      beforeDeploy: () => '# Before deploy\necho "Pre-deployment step"',
      afterDeploy: () => '# After deploy\necho "Post-deployment step"'
    };

    const result = await processCloudBuildTemplate({
      version: 'test',
      region: 'us-central1',
      repository: 'my-app-repo',
      hooks
    });

    // Check that hooks were included in shell utils
    expect(result.shellUtils).toContain('Custom validation step');
    expect(result.shellUtils).toContain('Pre-deployment step');
    expect(result.shellUtils).toContain('Post-deployment step');
  });
});
