import os from 'os';
import {
  FeatureFlag,
  FeatureFlagProps,
  PlatformSetting,
  PlatformSettingProps,
  PlatformAudit,
  PlatformAuditProps,
} from '../../domain/entities/AdminPlatform';
import {
  IAdminPlatformRepository,
  AuditListQuery,
  AuditListResult,
  AdminPlatformDashboardSummary,
  DatabaseCollectionStats,
} from '../../domain/ports/IAdminPlatformRepository';

export class InMemoryAdminPlatformRepository implements IAdminPlatformRepository {
  private featureFlags = new Map<string, FeatureFlagProps>();
  private settings = new Map<string, PlatformSettingProps>();
  private audits: PlatformAuditProps[] = [];

  // Feature Flags
  async listFeatureFlags(orgId?: string | null): Promise<FeatureFlag[]> {
    return Array.from(this.featureFlags.values())
      .filter(f => !orgId || f.organizationId === orgId || f.organizationId === null)
      .map(p => FeatureFlag.fromPersistence(p));
  }

  async getFeatureFlag(key: string, orgId?: string | null): Promise<FeatureFlag | null> {
    const k = key.toLowerCase();
    const flag = Array.from(this.featureFlags.values()).find(
      f => f.key === k && (orgId ? f.organizationId === orgId : true),
    );
    return flag ? FeatureFlag.fromPersistence(flag) : null;
  }

  async upsertFeatureFlag(flag: FeatureFlag): Promise<FeatureFlag> {
    const p = flag.toPersistence();
    const mapKey = `${p.organizationId ?? 'global'}:${p.key}`;
    this.featureFlags.set(mapKey, p);
    return flag;
  }

  // Platform Settings
  async listSettings(orgId?: string | null, namespace?: string): Promise<PlatformSetting[]> {
    return Array.from(this.settings.values())
      .filter(s => {
        if (orgId && s.organizationId !== orgId && s.organizationId !== null) return false;
        if (namespace && s.namespace !== namespace.toLowerCase()) return false;
        return true;
      })
      .map(p => PlatformSetting.fromPersistence(p));
  }

  async getSetting(namespace: string, key: string, orgId?: string | null): Promise<PlatformSetting | null> {
    const ns = namespace.toLowerCase();
    const k = key.toLowerCase();
    const setting = Array.from(this.settings.values()).find(
      s => s.namespace === ns && s.key === k && (orgId ? s.organizationId === orgId : true),
    );
    return setting ? PlatformSetting.fromPersistence(setting) : null;
  }

  async upsertSetting(setting: PlatformSetting): Promise<PlatformSetting> {
    const p = setting.toPersistence();
    const mapKey = `${p.organizationId ?? 'global'}:${p.namespace}:${p.key}`;
    this.settings.set(mapKey, p);
    return setting;
  }

  // Audit Logs
  async writeAudit(audit: PlatformAudit): Promise<PlatformAudit> {
    this.audits.unshift(audit.toPersistence());
    return audit;
  }

  async listAuditLogs(orgId: string | null | undefined, query: AuditListQuery): Promise<AuditListResult> {
    let list = [...this.audits];

    if (orgId) {
      list = list.filter(a => a.organizationId === orgId);
    }
    if (query.action) {
      list = list.filter(a => a.action === query.action);
    }
    if (query.resource) {
      list = list.filter(a => a.resource.toLowerCase().includes(query.resource!.toLowerCase()));
    }
    if (query.actorId) {
      list = list.filter(a => a.actorId === query.actorId);
    }

    const total = list.length;
    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(query.limit || 50, 200);
    const start = (page - 1) * limit;

    return {
      items: list.slice(start, start + limit).map(p => PlatformAudit.fromPersistence(p)),
      total,
      page,
      limit,
    };
  }

  // Dashboard & Dev Tools
  async getDashboardSummary(_orgId?: string | null): Promise<AdminPlatformDashboardSummary> {
    const mem = process.memoryUsage();
    return {
      organizations: 1,
      admins: 1,
      users: 5,
      activeSessions: 2,
      activity24h: 12,
      audit24h: this.audits.length,
      redis: false,
      system: {
        uptime: Math.floor(process.uptime()),
        platform: os.platform(),
        nodeVersion: process.version,
        memoryUsageMB: Math.round(mem.rss / (1024 * 1024)),
      },
    };
  }

  async listDatabaseCollections(): Promise<DatabaseCollectionStats[]> {
    return [
      { name: 'FeatureFlag', collection: 'featureflags', indexes: 2, paths: 7 },
      { name: 'PlatformSetting', collection: 'platformsettings', indexes: 2, paths: 8 },
      { name: 'PlatformAudit', collection: 'platformaudits', indexes: 4, paths: 11 },
    ];
  }
}
