import { Entity } from '../../../../core/domain/Entity';
import { DomainError } from '../../../../shared/errors';
import { v4 as uuidv4 } from 'uuid';

export interface DesignationProps {
  organizationId: string;
  title: string;
  code: string;
  departmentId?: string;
  level: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Designation extends Entity<string> {
  private _organizationId: string;
  private _title: string;
  private _code: string;
  private _departmentId?: string;
  private _level: number;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: DesignationProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._title = props.title;
    this._code = props.code;
    this._departmentId = props.departmentId;
    this._level = props.level;
    this._isActive = props.isActive;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    title: string;
    code: string;
    departmentId?: string;
    level?: number;
  }): Designation {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for designation.');
    }
    if (!params.title || params.title.trim().length === 0) {
      throw new DomainError('Designation title cannot be empty.');
    }
    if (!params.code || params.code.trim().length === 0) {
      throw new DomainError('Designation code cannot be empty.');
    }

    const now = new Date();
    return new Designation(uuidv4(), {
      organizationId: params.organizationId,
      title: params.title.trim(),
      code: params.code.trim().toUpperCase(),
      departmentId: params.departmentId,
      level: params.level ?? 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: DesignationProps): Designation {
    return new Designation(id, props);
  }

  public get organizationId(): string {
    return this._organizationId;
  }

  public get title(): string {
    return this._title;
  }

  public get code(): string {
    return this._code;
  }

  public get departmentId(): string | undefined {
    return this._departmentId;
  }

  public get level(): number {
    return this._level;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public updateDetails(params: {
    title?: string;
    code?: string;
    departmentId?: string;
    level?: number;
  }): void {
    if (params.title !== undefined) {
      if (!params.title.trim()) throw new DomainError('Designation title cannot be empty.');
      this._title = params.title.trim();
    }
    if (params.code !== undefined) {
      if (!params.code.trim()) throw new DomainError('Designation code cannot be empty.');
      this._code = params.code.trim().toUpperCase();
    }
    if (params.departmentId !== undefined) {
      this._departmentId = params.departmentId || undefined;
    }
    if (params.level !== undefined) {
      if (params.level < 1) throw new DomainError('Designation level must be positive.');
      this._level = params.level;
    }
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  public activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }
}
