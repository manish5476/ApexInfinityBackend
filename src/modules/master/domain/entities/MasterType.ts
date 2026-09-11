import { Entity } from '../../../../core/domain/Entity';

export interface MasterTypeProps {
  name: string;
  label: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMasterTypeParams {
  id: string;
  name: string;
  label: string;
  isActive?: boolean;
}

export class MasterType extends Entity<string> {
  private _props: MasterTypeProps;

  private constructor(id: string, props: MasterTypeProps) {
    super(id);
    this._props = props;
  }

  static create(params: CreateMasterTypeParams): MasterType {
    if (!params.name || !params.name.trim()) {
      throw new Error('Master type name is required');
    }
    if (!params.label || !params.label.trim()) {
      throw new Error('Master type label is required');
    }

    const now = new Date();
    return new MasterType(params.id, {
      name: params.name.toLowerCase().trim(),
      label: params.label.trim(),
      isActive: params.isActive !== undefined ? params.isActive : true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: MasterTypeProps & { id: string }): MasterType {
    return new MasterType(props.id, props);
  }

  updateDetails(params: Partial<{ name: string; label: string; isActive: boolean }>): void {
    if (params.name !== undefined) {
      if (!params.name.trim()) throw new Error('Master type name cannot be empty');
      this._props.name = params.name.toLowerCase().trim();
    }
    if (params.label !== undefined) {
      if (!params.label.trim()) throw new Error('Master type label cannot be empty');
      this._props.label = params.label.trim();
    }
    if (params.isActive !== undefined) {
      this._props.isActive = params.isActive;
    }
    this._props.updatedAt = new Date();
  }

  deactivate(): void {
    this._props.isActive = false;
    this._props.updatedAt = new Date();
  }

  get name() { return this._props.name; }
  get label() { return this._props.label; }
  get isActive() { return this._props.isActive; }
  get createdAt() { return this._props.createdAt; }
  get updatedAt() { return this._props.updatedAt; }
  get props() { return { ...this._props, id: this.id }; }
}
