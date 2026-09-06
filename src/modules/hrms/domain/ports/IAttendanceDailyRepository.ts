import { ITenantRepository } from '../../../../core/domain/IRepository';
import { AttendanceDaily } from '../entities/AttendanceDaily';

export interface IAttendanceDailyRepository extends ITenantRepository<AttendanceDaily, string> {
  findByEmployeeAndDate(
    organizationId: string,
    employeeId: string,
    date: Date
  ): Promise<AttendanceDaily | null>;
  findAll(organizationId: string, filter?: { employeeId?: string; date?: Date; from?: Date; to?: Date; status?: string }): Promise<AttendanceDaily[]>;
}
