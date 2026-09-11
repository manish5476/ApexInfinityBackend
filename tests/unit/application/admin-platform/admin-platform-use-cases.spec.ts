import { AdminPlatformUseCases } from '../../../../src/modules/admin-platform/application/use-cases/AdminPlatformUseCases';
import { InMemoryAdminPlatformRepository } from '../../../../src/modules/admin-platform/infrastructure/repositories/InMemoryAdminPlatformRepository';

describe('Admin Platform Module — Use Cases', () => {
  let repo: InMemoryAdminPlatformRepository;
  let useCases: AdminPlatformUseCases;

  const orgId = 'org-platform-101';
  const userId = 'admin-user-001';

  beforeEach(() => {
    repo = new InMemoryAdminPlatformRepository();
    useCases = new AdminPlatformUseCases(repo);
  });

  describe('Feature Flags', () => {
    it('creates or updates a feature flag and records an audit log', async () => {
      const flag = await useCases.upsertFeatureFlag({
        organizationId: orgId,
        key: 'beta_storefront_v2',
        name: 'Storefront V2 Beta',
        description: 'Enables redesigned storefront layout',
        enabled: true,
        rules: { rolloutPercentage: 50 },
        userId,
      });

      expect(flag.id).toBeDefined();
      expect(flag.key).toBe('beta_storefront_v2');
      expect(flag.enabled).toBe(true);

      const retrieved = await useCases.getFeatureFlag('beta_storefront_v2', orgId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe('Storefront V2 Beta');

      // Verify audit was recorded
      const audits = await useCases.listAuditLogs(orgId, { action: 'CONFIG_CHANGE' });
      expect(audits.items.length).toBeGreaterThanOrEqual(1);
      expect(audits.items[0]!.resource).toBe('FeatureFlag');
      expect(audits.items[0]!.resourceId).toBe('beta_storefront_v2');
    });

    it('lists all feature flags for an organization including global flags', async () => {
      await useCases.upsertFeatureFlag({
        organizationId: orgId,
        key: 'org_flag',
        name: 'Org Flag',
        enabled: true,
      });
      await useCases.upsertFeatureFlag({
        organizationId: null, // global flag
        key: 'global_flag',
        name: 'Global Flag',
        enabled: false,
      });

      const list = await useCases.listFeatureFlags(orgId);
      expect(list.length).toBe(2);
    });
  });

  describe('Platform Settings', () => {
    it('creates or updates a platform setting namespaced key-value', async () => {
      const setting = await useCases.upsertSetting({
        organizationId: orgId,
        namespace: 'notifications',
        key: 'email_rate_limit_per_minute',
        value: 120,
        description: 'Maximum emails sent per minute',
        userId,
      });

      expect(setting.id).toBeDefined();
      expect(setting.namespace).toBe('notifications');
      expect(setting.key).toBe('email_rate_limit_per_minute');
      expect(setting.value).toBe(120);

      const found = await useCases.getSetting('notifications', 'email_rate_limit_per_minute', orgId);
      expect(found).not.toBeNull();
      expect(found?.value).toBe(120);

      // Verify audit
      const audits = await useCases.listAuditLogs(orgId, { action: 'CONFIG_CHANGE' });
      expect(audits.items.some(a => a.resource === 'PlatformSetting')).toBe(true);
    });

    it('filters settings by namespace', async () => {
      await useCases.upsertSetting({ organizationId: orgId, namespace: 'billing', key: 'currency', value: 'INR' });
      await useCases.upsertSetting({ organizationId: orgId, namespace: 'security', key: 'mfa_required', value: true });

      const billingSettings = await useCases.listSettings(orgId, 'billing');
      expect(billingSettings).toHaveLength(1);
      expect(billingSettings[0]!.key).toBe('currency');
    });
  });

  describe('Audit Logging & Security Activity', () => {
    it('records security events and queries by action and resource', async () => {
      await useCases.writeAudit({
        organizationId: orgId,
        actorId: userId,
        action: 'SECURITY_EVENT',
        resource: 'User',
        resourceId: 'user-suspicious-99',
        metadata: { failedAttempts: 5 },
      });

      const result = await useCases.listAuditLogs(orgId, { action: 'SECURITY_EVENT' });
      expect(result.total).toBe(1);
      expect(result.items[0]!.resource).toBe('User');
      expect(result.items[0]!.resourceId).toBe('user-suspicious-99');
    });
  });

  describe('Dashboard & Internal Developer Tools', () => {
    it('provides dashboard summary metrics and system info', async () => {
      const summary = await useCases.getDashboardSummary(orgId);
      expect(summary.organizations).toBeGreaterThanOrEqual(1);
      expect(summary.system.platform).toBeDefined();
      expect(summary.system.nodeVersion).toBeDefined();
    });

    it('executes developer tools: database inspector, cache clearing, logs, echo, queue monitor, report generation', async () => {
      const dbStats = await useCases.databaseInspector();
      expect(dbStats.length).toBeGreaterThan(0);

      const cacheResult = await useCases.clearCache('cache:*');
      expect(cacheResult.cleared).toBe(true);
      expect(cacheResult.pattern).toBe('cache:*');

      const logs = await useCases.readLogs(50);
      expect(logs.lines.length).toBeGreaterThan(0);

      const echo = useCases.apiTesterEcho({ test: 123 }, { 'x-trace': '1' });
      expect(echo.echo).toEqual({ test: 123 });

      const queues = await useCases.queueMonitor();
      expect(queues.queues.length).toBeGreaterThanOrEqual(3);

      const report = await useCases.generateReport('audit_export', orgId);
      expect(report.id).toBeDefined();
      expect(report.type).toBe('audit_export');
    });
  });
});
