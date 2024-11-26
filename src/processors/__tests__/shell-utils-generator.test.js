import { generateShellUtils } from '../shell-utils-generator';

describe('Shell Utils Generator', () => {
  test('generates basic shell utils without hooks', async () => {
    const result = await generateShellUtils();

    // Check for key functions
    expect(result).toContain('#!/bin/bash');
    expect(result).toContain('validate_environment()');
    expect(result).toContain('build_and_push_image()');
    expect(result).toContain('deploy_to_cloud_run()');
    expect(result).toContain('setup_service_account()');
  });

  test('includes hook content when provided', async () => {
    const config = {
      hooks: {
        validateEnvironment: () => '\n# Custom validation\necho "Custom validation"',
        beforeDeploy: () => '\n# Pre-deploy steps\necho "Before deploy"',
        afterDeploy: () => '\n# Post-deploy steps\necho "After deploy"'
      }
    };

    const result = await generateShellUtils(config);

    expect(result).toContain('Custom validation');
    expect(result).toContain('Before deploy');
    expect(result).toContain('After deploy');
  });

  test('includes proper error handling', async () => {
    const result = await generateShellUtils();

    // Check for error handling patterns
    expect(result).toContain('|| exit 1');
    expect(result).toContain('❌ ERROR');
    expect(result).toContain('return 1');
  });

  test('includes utility functions', async () => {
    const result = await generateShellUtils();

    // Check for utility functions
    expect(result).toContain('print_section()');
    expect(result).toContain('sanitize_version()');
    expect(result).toContain('get_service_name()');
  });

  test('generates valid bash syntax', async () => {
    const result = await generateShellUtils();

    // Check for bash syntax elements
    expect(result).toContain('#!/bin/bash');
    expect(result).toContain('local ');
    expect(result).toMatch(/if.*then.*fi/s);  // Uses 's' flag for multiline matching
    expect(result).not.toContain('undefined');
  });
});
