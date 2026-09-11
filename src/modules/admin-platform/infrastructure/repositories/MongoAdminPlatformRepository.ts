import os from 'os';
import mongoose from 'mongoose';
import {
  FeatureFlag,
  FeatureFlagProps,
  PlatformSetting,
  PlatformSettingProps,
  PlatformAudit,
  PlatformAuditProps,
  PlatformAuditAction,
} from '../../domain/entities/AdminPlatform';
import {
  IAdminPlatformRepository,
  AuditListQuery,
  AuditListResult,
  AdminPlatformDashboardSummary,
  DatabaseCollectionStats,
} from '../../domain/ports/IAdminPlatformRepository';
import {
  FeatureFlagModel,
  FeatureFlagDoc,
  PlatformSettingModel,
  PlatformSettingDoc,
  PlatformAuditModel,
  PlatformAuditDoc,
} from '../persistence/adminPlatform.model';

export class MongoAdminPlatformRepository implements IAdminPlatformRepository {
  async listFeatureFlags(orgId?: string | null): Promise<FeatureFlag[]> {
    const filter = orgId
      ? { $or: [{ organizationId: orgId }, { organizationId: null }] }
      : {};
    const docs = await FeatureFlagModel.find(filter).lean<FeatureFlagDoc[]>();
    return docs.map(d =>
      FeatureFlag.fromPersistence({
        id: d._id.toString(),
        organizationId: d.organizationId?.toString() ?? null,
        key: d.key,
        name: d.name,
        description: d.description,
        enabled: d.enabled,
        rules: d.rules,
        updatedBy: d.updatedBy?.toString(),
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }),
    );
  }

  async getFeatureFlag(key: string, orgId?: string | null): Promise<FeatureFlag | null> {
    const filter: any = { key: key.toLowerCase() };
    if (orgId) {
      filter.$or = [{ organizationId: orgId }, { organizationId: null }];
    }
    const doc = await FeatureFlagModel.findOne(filter).lean<FeatureFlagDoc>();
    if (!doc) return null;
    return FeatureFlag.fromPersistence({
      id: doc._id.toString(),
      organizationId: doc.organizationId?.toString() ?? null,
      key: doc.key,
      name: doc.name,
      description: doc.description,
      enabled: doc.enabled,
      rules: doc.rules,
      updatedBy: doc.updatedBy?.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async upsertFeatureFlag(flag: FeatureFlag): Promise<FeatureFlag> {
    const p = flag.toPersistence();
    const filter = {
      organizationId: p.organizationId ? new mongoose.Types.ObjectId(p.organizationId) : null,
      key: p.key.toLowerCase(),
    };
    const update = {
      name: p.name,
      description: p.description,
      enabled: p.enabled,
      rules: p.rules,
      updatedBy: p.updatedBy ? new mongoose.Types.ObjectId(p.updatedBy) : null,
    };
    const doc = await FeatureFlagModel.findOneAndUpdate(filter, { $set: update }, { upsert: true, new: true }).lean<FeatureFlagDoc>();
    return FeatureFlag.fromPersistence({
      id: doc!._id.toString(),
      organizationId: doc!.organizationId?.toString() ?? null,
      key: doc!.key,
      name: doc!.name,
      description: doc!.description,
      enabled: doc!.enabled,
      rules: doc!.rules,
      updatedBy: doc!.updatedBy?.toString(),
      createdAt: doc!.createdAt,
      updatedAt: doc!.updatedAt,
    });
  }

  async listSettings(orgId?: string | null, namespace?: string): Promise<PlatformSetting[]> {
    const filter: any = {};
    if (orgId) {
      filter.$or = [{ organizationId: orgId }, { organizationId: null }];
    }
    if (namespace) {
      filter.namespace = namespace.toLowerCase();
    }
    const docs = await PlatformSettingModel.find(filter).lean<PlatformSettingDoc[]>();
    return docs.map(d =>
      PlatformSetting.fromPersistence({
        id: d._id.toString(),
        organizationId: d.organizationId?.toString() ?? null,
        namespace: d.namespace,
        key: d.key,
        value: d.value,
        encrypted: d.encrypted,
        description: d.description,
        updatedBy: d.updatedBy?.toString(),
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }),
    );
  }

  async getSetting(namespace: string, key: string, orgId?: string | null): Promise<PlatformSetting | null> {
    const filter: any = { namespace: namespace.toLowerCase(), key: key.toLowerCase() };
    if (orgId) {
      filter.$or = [{ organizationId: orgId }, { organizationId: null }];
    }
    const doc = await PlatformSettingModel.findOne(filter).lean<PlatformSettingDoc>();
    if (!doc) return null;
    return PlatformSetting.fromPersistence({
      id: doc._id.toString(),
      organizationId: doc.organizationId?.toString() ?? null,
      namespace: doc.namespace,
      key: doc.key,
      value: doc.value,
      encrypted: doc.encrypted,
      description: doc.description,
      updatedBy: doc.updatedBy?.toString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async upsertSetting(setting: PlatformSetting): Promise<PlatformSetting> {
    const p = setting.toPersistence();
    const filter = {
      organizationId: p.organizationId ? new mongoose.Types.ObjectId(p.organizationId) : null,
      namespace: p.namespace.toLowerCase(),
      key: p.key.toLowerCase(),
    };
    const update = {
      value: p.value,
      encrypted: p.encrypted,
      description: p.description,
      updatedBy: p.updatedBy ? new mongoose.Types.ObjectId(p.updatedBy) : null,
    };
    const doc = await PlatformSettingModel.findOneAndUpdate(filter, { $set: update }, { upsert: true, new: true }).lean<PlatformSettingDoc>();
    return PlatformSetting.fromPersistence({
      id: doc!._id.toString(),
      organizationId: doc!.organizationId?.toString() ?? null,
      namespace: doc!.namespace,
      key: doc!.key,
      value: doc!.value,
      encrypted: doc!.encrypted,
      description: doc!.description,
      updatedBy: doc!.updatedBy?.toString(),
      createdAt: doc!.createdAt,
      updatedAt: doc!.updatedAt,
    });
  }

  async writeAudit(audit: PlatformAudit): Promise<PlatformAudit> {
    const p = audit.toPersistence();
    const doc = await PlatformAuditModel.create({
      organizationId: p.organizationId ? new mongoose.Types.ObjectId(p.organizationId) : null,
      actorId: p.actorId ? new mongoose.Types.ObjectId(p.actorId) : null,
      action: p.action,
      resource: p.resource,
      resourceId: p.resourceId,
      before: p.before,
      after: p.after,
      metadata: p.metadata,
      ipAddress: p.ipAddress,
      userAgent: p.userAgent,
      requestId: p.requestId,
    });
    return PlatformAudit.fromPersistence({
      id: doc._id.toString(),
      organizationId: doc.organizationId?.toString() ?? null,
      actorId: doc.actorId?.toString() ?? null,
      action: doc.action as PlatformAuditAction,
      resource: doc.resource,
      resourceId: doc.resourceId,
      before: doc.before,
      after: doc.after,
      metadata: doc.metadata,
      ipAddress: doc.ipAddress,
      userAgent: doc.userAgent,
      requestId: doc.requestId,
      createdAt: doc.createdAt,
    });
  }

  async listAuditLogs(orgId: string | null | undefined, query: AuditListQuery): Promise<AuditListResult> {
    const filter: any = {};
    if (orgId) filter.organizationId = orgId;
    if (query.action) filter.action = query.action;
    if (query.resource) filter.resource = new RegExp(query.resource, 'i');
    if (query.actorId) filter.actorId = query.actorId;

    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(query.limit || 50, 200);

    const [docs, total] = await Promise.all([
      PlatformAuditModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<PlatformAuditDoc[]>(),
      PlatformAuditModel.countDocuments(filter),
    ]);

    return {
      items: docs.map(d =>
        PlatformAudit.fromPersistence({
          id: d._id.toString(),
          organizationId: d.organizationId?.toString() ?? null,
          actorId: d.actorId?.toString() ?? null,
          action: d.action as PlatformAuditAction,
          resource: d.resource,
          resourceId: d.resourceId,
          before: d.before,
          after: d.after,
          metadata: d.metadata,
          ipAddress: d.ipAddress,
          userAgent: d.userAgent,
          requestId: d.requestId,
          createdAt: d.createdAt,
        }),
      ),
      total,
      page,
      limit,
    };
  }

  async getDashboardSummary(orgId?: string | null): Promise<AdminPlatformDashboardSummary> {
    const filter: any = orgId ? { organizationId: new mongoose.Types.ObjectId(orgId) } : {};
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const audit24h = await PlatformAuditModel.countDocuments({
      ...filter,
      createdAt: { $gte: since24h },
    });

    const mem = process.memoryUsage();
    return {
      organizations: 1,
      admins: 1,
      users: 1,
      activeSessions: 1,
      activity24h: 10,
      audit24h,
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
    return mongoose.connection.modelNames().sort().map((name) => {
      const model = mongoose.connection.model(name);
      return {
        name,
        collection: model.collection.name,
        indexes: Object.keys(model.schema.indexes?.() || {}).length,
        paths: Object.keys(model.schema.paths).length,
      };
    });
  }
}
