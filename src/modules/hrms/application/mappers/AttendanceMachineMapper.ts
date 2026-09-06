import { IMapper } from '../../../../core/application/IMapper';
import { AttendanceMachine, AttendanceMachineProps } from '../../domain/entities/AttendanceMachine';

export class AttendanceMachineMapper implements IMapper<AttendanceMachine, any, any> {
  public toDomain(raw: any): AttendanceMachine {
    const props: AttendanceMachineProps = {
      organizationId: raw.organizationId,
      branchId: raw.branchId || undefined,
      name: raw.name,
      serialNumber: raw.serialNumber,
      model: raw.model || undefined,
      manufacturer: raw.manufacturer || undefined,
      providerType: raw.providerType || 'generic',
      ipAddress: raw.ipAddress || undefined,
      port: raw.port || undefined,
      status: raw.status || 'active',
      connectionStatus: raw.connectionStatus || 'disconnected',
      lastSyncAt: raw.lastSyncAt ? new Date(raw.lastSyncAt) : undefined,
      lastPingAt: raw.lastPingAt ? new Date(raw.lastPingAt) : undefined,
      apiKey: raw.apiKey,
      userMappings: raw.userMappings || [],
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
    return AttendanceMachine.reconstitute(raw._id || raw.id, props);
  }

  public toPersistence(domain: AttendanceMachine): Record<string, unknown> {
    return {
      _id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      name: domain.name,
      serialNumber: domain.serialNumber,
      model: domain.model,
      manufacturer: domain.manufacturer,
      providerType: domain.providerType,
      ipAddress: domain.ipAddress,
      port: domain.port,
      status: domain.status,
      connectionStatus: domain.connectionStatus,
      lastSyncAt: domain.lastSyncAt,
      lastPingAt: domain.lastPingAt,
      apiKey: domain.apiKey,
      userMappings: domain.userMappings,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public toDto(domain: AttendanceMachine): any {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      name: domain.name,
      serialNumber: domain.serialNumber,
      model: domain.model,
      manufacturer: domain.manufacturer,
      providerType: domain.providerType,
      ipAddress: domain.ipAddress,
      port: domain.port,
      status: domain.status,
      connectionStatus: domain.connectionStatus,
      lastSyncAt: domain.lastSyncAt?.toISOString(),
      lastPingAt: domain.lastPingAt?.toISOString(),
      apiKey: domain.apiKey,
      userMappings: domain.userMappings,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}
