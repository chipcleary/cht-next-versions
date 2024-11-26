import processNextConfig from '../next-config-processor';

describe('Next Config Processor', () => {
  test('generates minimal config with required settings', () => {
    const result = processNextConfig();

    expect(result).toContain('"output": "standalone"');  // Required for Cloud Run
    expect(result).toContain('export default nextConfig');
  });

  test('incorporates base config', () => {
    const baseConfig = {
      reactStrictMode: true,
      experimental: {
        optimizeCss: true
      }
    };

    const result = processNextConfig({ baseConfig });

    expect(result).toContain('"reactStrictMode": true');
    expect(result).toContain('"optimizeCss": true');
    expect(result).toContain('"output": "standalone"');  // Still includes required setting
  });

  test('allows hook to modify config', () => {
    const configHook = (config) => ({
      ...config,
      env: {
        customVar: 'test'
      }
    });

    const result = processNextConfig({ configHook });

    expect(result).toContain('"env"');
    expect(result).toContain('"customVar"');
    expect(result).toContain('"output": "standalone"');  // Still includes required setting
  });

  test('preserves standalone output regardless of hook modifications', () => {
    const configHook = (config) => ({
      ...config,
      output: 'something-else'  // Try to override standalone
    });

    const result = processNextConfig({ configHook });

    expect(result).toContain('"output": "standalone"');  // Required setting is preserved
  });
});
