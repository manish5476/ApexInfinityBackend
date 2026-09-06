import { ITenantRepository } from '../../../../core/domain/IRepository';
import { AttendanceMachine } from '../entities/AttendanceMachine';

export interface IAttendanceMachineRepository extends ITenantRepository<AttendanceMachine, string> {
  findBySerialNumber(organizationId: string, serialNumber: string): Promise<AttendanceMachine | null>;
  findByApiKey(apiKey: string): Promise<AttendanceMachine | null>;
  findAll(organizationId: string, filter?: { status?: string; branchId?: string }): Promise<AttendanceMachine[]>;
}
