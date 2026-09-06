import { Entity } from '../../../../core/domain/Entity';
import { DomainError } from '../../../../shared/errors';
import { MachineProviderType, MachineStatus, MachineConnectionStatus } from '../value-objects/HrmsEnums';
import { v4 as uuidv4 } from 'uuid';

export interface MachineUserMapping {
  machineUserId: string;
  userId: string;
  mappedAt: Date;
}

export interface AttendanceMachineProps {
  organizationId: string;
  branchId?: string;
  name: string;
  serialNumber: string;
  model?: string;
  manufacturer?: string;
  providerType: MachineProviderType;
  ipAddress?: string;
  port?: number;
  status: MachineStatus;
  connectionStatus: MachineConnectionStatus;
  lastSyncAt?: Date;
  lastPingAt?: Date;
  apiKey: string;
  userMappings: MachineUserMapping[];
  createdAt: Date;
  updatedAt: Date;
}

export class AttendanceMachine extends Entity<string> {
  private _organizationId: string;
  private _branchId?: string;
  private _name: string;
  private _serialNumber: string;
  private _model?: string;
  private _manufacturer?: string;
  private _providerType: MachineProviderType;
  private _ipAddress?: string;
  private _port?: number;
  private _status: MachineStatus;
  private _connectionStatus: MachineConnectionStatus;
  private _lastSyncAt?: Date;
  private _lastPingAt?: Date;
  private _apiKey: string;
  private _userMappings: MachineUserMapping[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: AttendanceMachineProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._branchId = props.branchId;
    this._name = props.name;
    this._serialNumber = props.serialNumber;
    this._model = props.model;
    this._manufacturer = props.manufacturer;
    this._providerType = props.providerType;
    this._ipAddress = props.ipAddress;
    this._port = props.port;
    this._status = props.status;
    this._connectionStatus = props.connectionStatus;
    this._lastSyncAt = props.lastSyncAt;
    this._lastPingAt = props.lastPingAt;
    this._apiKey = props.apiKey;
    this._userMappings = props.userMappings;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    branchId?: string;
    name: string;
    serialNumber: string;
    model?: string;
    manufacturer?: string;
    providerType?: MachineProviderType;
    ipAddress?: string;
    port?: number;
    apiKey?: string;
  }): AttendanceMachine {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for attendance machine.');
    }
    if (!params.name || params.name.trim().length === 0) {
      throw new DomainError('Machine name cannot be empty.');
    }
    if (!params.serialNumber || params.serialNumber.trim().length === 0) {
      throw new DomainError('Serial number cannot be empty.');
    }

    const now = new Date();
    return new AttendanceMachine(uuidv4(), {
      organizationId: params.organizationId,
      branchId: params.branchId,
      name: params.name.trim(),
      serialNumber: params.serialNumber.trim(),
      model: params.model?.trim(),
      manufacturer: params.manufacturer?.trim(),
      providerType: params.providerType ?? 'generic',
      ipAddress: params.ipAddress?.trim(),
      port: params.port,
      status: 'active',
      connectionStatus: 'disconnected',
      apiKey: params.apiKey || uuidv4().replace(/-/g, ''),
      userMappings: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: AttendanceMachineProps): AttendanceMachine {
    return new AttendanceMachine(id, props);
  }

  public get organizationId(): string {
    return this._organizationId;
  }

  public get branchId(): string | undefined {
    return this._branchId;
  }

  public get name(): string {
    return this._name;
  }

  public get serialNumber(): string {
    return this._serialNumber;
  }

  public get model(): string | undefined {
    return this._model;
  }

  public get manufacturer(): string | undefined {
    return this._manufacturer;
  }

  public get providerType(): MachineProviderType {
    return this._providerType;
  }

  public get ipAddress(): string | undefined {
    return this._ipAddress;
  }

  public get port(): number | undefined {
    return this._port;
  }

  public get status(): MachineStatus {
    return this._status;
  }

  public get connectionStatus(): MachineConnectionStatus {
    return this._connectionStatus;
  }

  public get lastSyncAt(): Date | undefined {
    return this._lastSyncAt;
  }

  public get lastPingAt(): Date | undefined {
    return this._lastPingAt;
  }

  public get apiKey(): string {
    return this._apiKey;
  }

  public get userMappings(): ReadonlyArray<MachineUserMapping> {
    return this._userMappings;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public updateDetails(params: {
    name?: string;
    model?: string;
    manufacturer?: string;
    providerType?: MachineProviderType;
    ipAddress?: string;
    port?: number;
    status?: MachineStatus;
  }): void {
    if (params.name !== undefined) {
      if (!params.name.trim()) throw new DomainError('Name cannot be empty.');
      this._name = params.name.trim();
    }
    if (params.model !== undefined) this._model = params.model.trim();
    if (params.manufacturer !== undefined) this._manufacturer = params.manufacturer.trim();
    if (params.providerType !== undefined) this._providerType = params.providerType;
    if (params.ipAddress !== undefined) this._ipAddress = params.ipAddress.trim();
    if (params.port !== undefined) this._port = params.port;
    if (params.status !== undefined) this._status = params.status;
    this._updatedAt = new Date();
  }

  public recordPing(): void {
    this._lastPingAt = new Date();
    this._connectionStatus = 'online';
    this._updatedAt = new Date();
  }

  public recordSync(): void {
    this._lastSyncAt = new Date();
    this._connectionStatus = 'online';
    this._updatedAt = new Date();
  }

  public regenerateApiKey(): string {
    this._apiKey = uuidv4().replace(/-/g, '');
    this._updatedAt = new Date();
    return this._apiKey;
  }

  public mapUser(machineUserId: string, userId: string): void {
    const existingIndex = this._userMappings.findIndex((m) => m.machineUserId === machineUserId);
    if (existingIndex >= 0) {
      this._userMappings[existingIndex] = { machineUserId, userId, mappedAt: new Date() };
    } else {
      this._userMappings.push({ machineUserId, userId, mappedAt: new Date() });
    }
    this._updatedAt = new Date();
  }
}
