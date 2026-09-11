// ─────────────────────────────────────────────────────────────────────────────
//  Admin Platform — Domain Entities
//  Pure domain models — zero infrastructure imports.
// ─────────────────────────────────────────────────────────────────────────────

export interface FeatureFlagProps {
  id: string;
  organizationId?: string | null;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rules?: Record<string, unknown>;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class FeatureFlag {
  private readonly _props: FeatureFlagProps;

  private constructor(props: FeatureFlagProps) {
    this._props = { ...props };
  }

  static create(id: string, params: Omit<FeatureFlagProps, 'id' | 'createdAt' | 'updatedAt'>, now = new Date()): FeatureFlag {
    return new FeatureFlag({
      id,
      organizationId: params.organizationId ?? null,
      key: params.key.trim().toLowerCase(),
      name: params.name.trim(),
      description: params.description,
      enabled: params.enabled ?? false,
      rules: params.rules ?? {},
      updatedBy: params.updatedBy,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: FeatureFlagProps): FeatureFlag {
    return new FeatureFlag(props);
  }

  get id(): string { return this._props.id; }
  get organizationId(): string | null | undefined { return this._props.organizationId; }
  get key(): string { return this._props.key; }
  get name(): string { return this._props.name; }
  get description(): string | undefined { return this._props.description; }
  get enabled(): boolean { return this._props.enabled; }
  get rules(): Record<string, unknown> | undefined { return this._props.rules; }
  get updatedBy(): string | undefined { return this._props.updatedBy; }
  get createdAt(): Date { return this._props.createdAt; }
  get updatedAt(): Date { return this._props.updatedAt; }

  toPersistence(): FeatureFlagProps {
    return { ...this._props };
  }
}

export interface PlatformSettingProps {
  id: string;
  organizationId?: string | null;
  namespace: string;
  key: string;
  value: unknown;
  encrypted?: boolean;
  description?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PlatformSetting {
  private readonly _props: PlatformSettingProps;

  private constructor(props: PlatformSettingProps) {
    this._props = { ...props };
  }

  static create(id: string, params: Omit<PlatformSettingProps, 'id' | 'createdAt' | 'updatedAt'>, now = new Date()): PlatformSetting {
    return new PlatformSetting({
      id,
      organizationId: params.organizationId ?? null,
      namespace: params.namespace.trim().toLowerCase(),
      key: params.key.trim().toLowerCase(),
      value: params.value,
      encrypted: params.encrypted ?? false,
      description: params.description,
      updatedBy: params.updatedBy,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: PlatformSettingProps): PlatformSetting {
    return new PlatformSetting(props);
  }

  get id(): string { return this._props.id; }
  get organizationId(): string | null | undefined { return this._props.organizationId; }
  get namespace(): string { return this._props.namespace; }
  get key(): string { return this._props.key; }
  get value(): unknown { return this._props.value; }
  get encrypted(): boolean | undefined { return this._props.encrypted; }
  get description(): string | undefined { return this._props.description; }
  get updatedBy(): string | undefined { return this._props.updatedBy; }
  get createdAt(): Date { return this._props.createdAt; }
  get updatedAt(): Date { return this._props.updatedAt; }

  toPersistence(): PlatformSettingProps {
    return { ...this._props };
  }
}

export type PlatformAuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPERSONATE'
  | 'CONFIG_CHANGE'
  | 'SECURITY_EVENT'
  | 'INTERNAL_TOOL';

export interface PlatformAuditProps {
  id: string;
  organizationId?: string | null;
  actorId?: string | null;
  action: PlatformAuditAction;
  resource: string;
  resourceId?: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  createdAt: Date;
}

export class PlatformAudit {
  private readonly _props: PlatformAuditProps;

  private constructor(props: PlatformAuditProps) {
    this._props = { ...props };
  }

  static create(id: string, params: Omit<PlatformAuditProps, 'id' | 'createdAt'>, now = new Date()): PlatformAudit {
    return new PlatformAudit({
      id,
      organizationId: params.organizationId ?? null,
      actorId: params.actorId ?? null,
      action: params.action,
      resource: params.resource.trim(),
      resourceId: params.resourceId?.trim(),
      before: params.before,
      after: params.after,
      metadata: params.metadata ?? {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      requestId: params.requestId,
      createdAt: now,
    });
  }

  static fromPersistence(props: PlatformAuditProps): PlatformAudit {
    return new PlatformAudit(props);
  }

  get id(): string { return this._props.id; }
  get organizationId(): string | null | undefined { return this._props.organizationId; }
  get actorId(): string | null | undefined { return this._props.actorId; }
  get action(): PlatformAuditAction { return this._props.action; }
  get resource(): string { return this._props.resource; }
  get resourceId(): string | undefined { return this._props.resourceId; }
  get before(): unknown { return this._props.before; }
  get after(): unknown { return this._props.after; }
  get metadata(): Record<string, unknown> | undefined { return this._props.metadata; }
  get ipAddress(): string | undefined { return this._props.ipAddress; }
  get userAgent(): string | undefined { return this._props.userAgent; }
  get requestId(): string | undefined { return this._props.requestId; }
  get createdAt(): Date { return this._props.createdAt; }

  toPersistence(): PlatformAuditProps {
    return { ...this._props };
  }
}
