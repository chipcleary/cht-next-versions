const {
  createValidateCommand,
  createCreateCommand,
  createGrantRoleCommand,
  generateServiceAccountScript
} = require('../service-account-utils');

describe('Service Account Utilities', () => {
  test('creates validate command', () => {
    const cmd = createValidateCommand('test-sa@project.iam.gserviceaccount.com');
    expect(cmd).toContain('gcloud iam service-accounts describe');
    expect(cmd).toContain('>/dev/null 2>&1');
  });

  test('creates create command', () => {
    const cmd = createCreateCommand('test-sa', 'Test Service Account');
    expect(cmd).toContain('gcloud iam service-accounts create "test-sa"');
    expect(cmd).toContain('--display-name="Test Service Account"');
  });

  test('creates grant role command', () => {
    const cmd = createGrantRoleCommand(
      'test-project',
      'test-sa@test-project.iam.gserviceaccount.com',
      'roles/secretmanager.secretAccessor'
    );
    expect(cmd).toContain('gcloud projects add-iam-policy-binding test-project');
    expect(cmd).toContain('--member="serviceAccount:test-sa@test-project.iam.gserviceaccount.com"');
    expect(cmd).toContain('--role="roles/secretmanager.secretAccessor"');
  });

  describe('generateServiceAccountScript', () => {
    const config = {
      projectId: 'test-project',
      version: 'feature-x',
      roles: ['roles/secretmanager.secretAccessor', 'roles/cloudrun.invoker']
    };

    const script = generateServiceAccountScript(config);

    test('includes length validation', () => {
      expect(script).toContain('[ ${#sa_id} -lt 6 ] || [ ${#sa_id} -gt 30 ]');
    });

    test('includes existence check', () => {
      expect(script).toContain('if gcloud iam service-accounts describe');
    });

    test('includes creation command', () => {
      expect(script).toContain('gcloud iam service-accounts create');
    });

    test('includes all specified roles', () => {
      expect(script).toContain('roles/secretmanager.secretAccessor');
      expect(script).toContain('roles/cloudrun.invoker');
    });

    test('includes error handling', () => {
      expect(script).toContain('❌ ERROR');
      expect(script).toContain('exit 1');
    });

    test('uses correct service account naming', () => {
      const saId = 'feature-x-sa';
      expect(script).toContain(saId);
      expect(script).toContain(`${saId}@test-project.iam.gserviceaccount.com`);
    });

    test('includes propagation delay', () => {
      expect(script).toContain('sleep 10');
    });
  });
});
