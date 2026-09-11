import { FeatureFlag, PlatformSetting, PlatformAudit } from '../entities/AdminPlatform';

export interface AuditListQuery {
  page?: number;
  limit?: number;
  action?: string;
  resource?: string;
  actorId?: string;
}

export interface AuditListResult {
  items: PlatformAudit[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminPlatformDashboardSummary {
  organizations: number;
  admins: number;
  users: number;
  activeSessions: number;
  activity24h: number;
  audit24h: number;
  redis: boolean;
  system: {
    uptime: number;
    platform: string;
    nodeVersion: string;
    memoryUsageMB: number;
  };
}

export interface DatabaseCollectionStats {
  name: string;
  collection: string;
  indexes: number;
  paths: number;
}

export interface IAdminPlatformRepository {
  // Feature Flags
  listFeatureFlags(orgId?: string | null): Promise<FeatureFlag[]>;
  getFeatureFlag(key: string, orgId?: string | null): Promise<FeatureFlag | null>;
  upsertFeatureFlag(flag: FeatureFlag): Promise<FeatureFlag>;

  // Platform Settings
  listSettings(orgId?: string | null, namespace?: string): Promise<PlatformSetting[]>;
  getSetting(namespace: string, key: string, orgId?: string | null): Promise<PlatformSetting | null>;
  upsertSetting(setting: PlatformSetting): Promise<PlatformSetting>;

  // Audit Logs
  writeAudit(audit: PlatformAudit): Promise<PlatformAudit>;
  listAuditLogs(orgId: string | null | undefined, query: AuditListQuery): Promise<AuditListResult>;

  // Dashboard & Dev Tools
  getDashboardSummary(orgId?: string | null): Promise<AdminPlatformDashboardSummary>;
  listDatabaseCollections(): Promise<DatabaseCollectionStats[]>;
}
