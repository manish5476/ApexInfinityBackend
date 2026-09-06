import { Entity } from '../../../../core/domain/Entity';
import { DomainError } from '../../../../shared/errors';
import { v4 as uuidv4 } from 'uuid';

export interface DepartmentProps {
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Department extends Entity<string> {
  private _organizationId: string;
  private _name: string;
  private _code: string;
  private _description?: string;
  private _parentId?: string;
  private _managerId?: string;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: DepartmentProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._name = props.name;
    this._code = props.code;
    this._description = props.description;
    this._parentId = props.parentId;
    this._managerId = props.managerId;
    this._isActive = props.isActive;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    name: string;
    code: string;
    description?: string;
    parentId?: string;
    managerId?: string;
  }): Department {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for department.');
    }
    if (!params.name || params.name.trim().length === 0) {
      throw new DomainError('Department name cannot be empty.');
    }
    if (!params.code || params.code.trim().length === 0) {
      throw new DomainError('Department code cannot be empty.');
    }

    const now = new Date();
    return new Department(uuidv4(), {
      organizationId: params.organizationId,
      name: params.name.trim(),
      code: params.code.trim().toUpperCase(),
      description: params.description?.trim(),
      parentId: params.parentId,
      managerId: params.managerId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: DepartmentProps): Department {
    return new Department(id, props);
  }

  public get organizationId(): string {
    return this._organizationId;
  }

  public get name(): string {
    return this._name;
  }

  public get code(): string {
    return this._code;
  }

  public get description(): string | undefined {
    return this._description;
  }

  public get parentId(): string | undefined {
    return this._parentId;
  }

  public get managerId(): string | undefined {
    return this._managerId;
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
    name?: string;
    code?: string;
    description?: string;
    parentId?: string;
    managerId?: string;
  }): void {
    if (params.name !== undefined) {
      if (!params.name.trim()) throw new DomainError('Department name cannot be empty.');
      this._name = params.name.trim();
    }
    if (params.code !== undefined) {
      if (!params.code.trim()) throw new DomainError('Department code cannot be empty.');
      this._code = params.code.trim().toUpperCase();
    }
    if (params.description !== undefined) {
      this._description = params.description.trim();
    }
    if (params.parentId !== undefined) {
      if (params.parentId === this.id) {
        throw new DomainError('A department cannot be its own parent.');
      }
      this._parentId = params.parentId || undefined;
    }
    if (params.managerId !== undefined) {
      this._managerId = params.managerId || undefined;
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
