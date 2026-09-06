import { Entity } from '../../../../core/domain/Entity';
import { DomainError } from '../../../../shared/errors';
import { v4 as uuidv4 } from 'uuid';

export interface GeoFenceProps {
  organizationId: string;
  branchId?: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  assignedUsers: string[];
  assignedDepartments: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GeoFence extends Entity<string> {
  private _organizationId: string;
  private _branchId?: string;
  private _name: string;
  private _description?: string;
  private _latitude: number;
  private _longitude: number;
  private _radius: number;
  private _assignedUsers: string[];
  private _assignedDepartments: string[];
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: GeoFenceProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._branchId = props.branchId;
    this._name = props.name;
    this._description = props.description;
    this._latitude = props.latitude;
    this._longitude = props.longitude;
    this._radius = props.radius;
    this._assignedUsers = props.assignedUsers;
    this._assignedDepartments = props.assignedDepartments;
    this._isActive = props.isActive;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    branchId?: string;
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
    radius?: number;
    assignedUsers?: string[];
    assignedDepartments?: string[];
  }): GeoFence {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for geofence.');
    }
    if (!params.name || params.name.trim().length === 0) {
      throw new DomainError('Geofence name cannot be empty.');
    }
    if (params.latitude === undefined || params.longitude === undefined) {
      throw new DomainError('Latitude and longitude are required.');
    }

    const now = new Date();
    return new GeoFence(uuidv4(), {
      organizationId: params.organizationId,
      branchId: params.branchId,
      name: params.name.trim(),
      description: params.description?.trim(),
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius ?? 100,
      assignedUsers: params.assignedUsers ?? [],
      assignedDepartments: params.assignedDepartments ?? [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: GeoFenceProps): GeoFence {
    return new GeoFence(id, props);
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

  public get description(): string | undefined {
    return this._description;
  }

  public get latitude(): number {
    return this._latitude;
  }

  public get longitude(): number {
    return this._longitude;
  }

  public get radius(): number {
    return this._radius;
  }

  public get assignedUsers(): ReadonlyArray<string> {
    return this._assignedUsers;
  }

  public get assignedDepartments(): ReadonlyArray<string> {
    return this._assignedDepartments;
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
    description?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): void {
    if (params.name !== undefined) {
      if (!params.name.trim()) throw new DomainError('Name cannot be empty.');
      this._name = params.name.trim();
    }
    if (params.description !== undefined) this._description = params.description.trim();
    if (params.latitude !== undefined) this._latitude = params.latitude;
    if (params.longitude !== undefined) this._longitude = params.longitude;
    if (params.radius !== undefined) {
      if (params.radius <= 0) throw new DomainError('Radius must be positive.');
      this._radius = params.radius;
    }
    this._updatedAt = new Date();
  }

  public assignUsers(userIds: string[]): void {
    this._assignedUsers = Array.from(new Set([...this._assignedUsers, ...userIds]));
    this._updatedAt = new Date();
  }

  public assignDepartments(departmentIds: string[]): void {
    this._assignedDepartments = Array.from(new Set([...this._assignedDepartments, ...departmentIds]));
    this._updatedAt = new Date();
  }

  /**
   * Haversine formula calculation to test if a point is within this geofence.
   */
  public isPointInside(lat: number, lon: number): boolean {
    const R = 6371e3; // metres
    const phi1 = (this._latitude * Math.PI) / 180;
    const phi2 = (lat * Math.PI) / 180;
    const deltaPhi = ((lat - this._latitude) * Math.PI) / 180;
    const deltaLambda = ((lon - this._longitude) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance <= this._radius;
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
