const {
  sanitizeVersionName,
  getCloudRunServiceName,
  getDockerImagePath,
  getServiceAccountEmail,
  getServiceUrl,
  validateResourceNames
} = require('../resource-utils');

describe('Resource Utilities', () => {
  const validConfig = {
    projectId: 'test-project',
    version: 'feature-x',
    region: 'us-central1',
    repository: 'cloud-run-source-deploy'
  };

  describe('sanitizeVersionName', () => {
    test('converts to lowercase', () => {
      expect(sanitizeVersionName('FEATURE-X')).toBe('feature-x');
    });

    test('replaces invalid characters', () => {
      expect(sanitizeVersionName('feature_branch.1')).toBe('feature-branch-1');
    });

    test('throws on invalid start character', () => {
      expect(() => sanitizeVersionName('1-feature')).toThrow();
    });

    test('throws on empty string', () => {
      expect(() => sanitizeVersionName('')).toThrow();
    });

    test('throws on too long name', () => {
      expect(() => sanitizeVersionName('a'.repeat(21))).toThrow();
    });
  });

  describe('getCloudRunServiceName', () => {
    test('generates valid service name', () => {
      const result = getCloudRunServiceName(validConfig);
      expect(result).toBe('test-project-feature-x');
    });

    test('throws on too long project ID', () => {
      const longConfig = {
        ...validConfig,
        projectId: 'a'.repeat(31),
        version: 'feature-x'
      };
      expect(() => getCloudRunServiceName(longConfig)).toThrow(/Project ID.*exceeds 30 characters/);
    });

    test('throws on missing project ID', () => {
      const invalidConfig = {
        ...validConfig,
        projectId: undefined
      };
      expect(() => getCloudRunServiceName(invalidConfig)).toThrow('Project ID is required');
    });

    test('throws when combined name is too long', () => {
      const longConfig = {
        ...validConfig,
        projectId: 'a'.repeat(30),  // Max length project ID
        version: 'b'.repeat(20)     // Max length version
      };
      // 30 + 1 (hyphen) + 20 = 51 chars, should not throw
      expect(() => getCloudRunServiceName(longConfig)).not.toThrow();

      const tooLongConfig = {
        ...validConfig,
        projectId: 'a'.repeat(50),  // Extra long project ID
        version: 'feature-x'
      };
      expect(() => getCloudRunServiceName(tooLongConfig)).toThrow(/exceeds.*characters/);
    });

    test('sanitizes version name', () => {
      const config = {
        ...validConfig,
        version: 'Feature_Branch.1'
      };
      const result = getCloudRunServiceName(config);
      expect(result).toBe('test-project-feature-branch-1');
    });
  });

  describe('getDockerImagePath', () => {
    test('generates valid image path', () => {
      const result = getDockerImagePath(validConfig);
      expect(result).toBe('us-central1-docker.pkg.dev/test-project/cloud-run-source-deploy/feature-x');
    });

    test('handles sanitized version names', () => {
      const config = { ...validConfig, version: 'Feature_X' };
      const result = getDockerImagePath(config);
      expect(result).toBe('us-central1-docker.pkg.dev/test-project/cloud-run-source-deploy/feature-x');
    });
  });

  describe('getServiceAccountEmail', () => {
    test('generates valid service account email', () => {
      const result = getServiceAccountEmail(validConfig);
      expect(result).toBe('feature-x-sa@test-project.iam.gserviceaccount.com');
    });

    test('throws on too short service account ID', () => {
      const config = { ...validConfig, version: 'a' };
      expect(() => getServiceAccountEmail(config)).toThrow();
    });

    test('throws on too long service account ID', () => {
      const config = { ...validConfig, version: 'a'.repeat(28) };
      expect(() => getServiceAccountEmail(config)).toThrow();
    });
  });

  describe('getServiceUrl', () => {
    test('generates valid service URL', () => {
      const result = getServiceUrl(validConfig);
      expect(result).toBe('https://test-project-feature-x-us-central1.run.app');
    });
  });

  describe('validateResourceNames', () => {
    test('returns all valid resource names', () => {
      const result = validateResourceNames(validConfig);
      expect(result).toEqual({
        version: 'feature-x',
        serviceName: 'test-project-feature-x',
        imageUrl: 'us-central1-docker.pkg.dev/test-project/cloud-run-source-deploy/feature-x',
        serviceAccount: 'feature-x-sa@test-project.iam.gserviceaccount.com',
        serviceUrl: 'https://test-project-feature-x-us-central1.run.app'
      });
    });

    test('throws on missing required fields', () => {
      expect(() => validateResourceNames({})).toThrow();
      expect(() => validateResourceNames({ projectId: 'test' })).toThrow();
      expect(() => validateResourceNames({ projectId: 'test', version: 'v1' })).toThrow();
    });

    test('validates all resource names', () => {
      const invalidConfig = {
        ...validConfig,
        version: '1-invalid'  // Starts with number
      };
      expect(() => validateResourceNames(invalidConfig)).toThrow();
    });
  });
});
