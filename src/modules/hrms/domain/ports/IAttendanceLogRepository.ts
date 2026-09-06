import { ITenantRepository } from '../../../../core/domain/IRepository';
import { AttendanceLog } from '../entities/AttendanceLog';

export interface IAttendanceLogRepository extends ITenantRepository<AttendanceLog, string> {
  findByUser(organizationId: string, userId: string, from?: Date, to?: Date): Promise<AttendanceLog[]>;
  findAll(organizationId: string, filter?: { userId?: string; machineId?: string; from?: Date; to?: Date; isFlagged?: boolean }): Promise<AttendanceLog[]>;
  saveMany(logs: AttendanceLog[]): Promise<void>;
}
