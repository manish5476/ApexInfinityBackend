import { ITenantRepository } from '../../../../core/domain/IRepository';
import { Holiday } from '../entities/Holiday';

export interface IHolidayRepository extends ITenantRepository<Holiday, string> {
  findByYear(organizationId: string, year: number, branchId?: string): Promise<Holiday[]>;
  findByDate(organizationId: string, date: Date, branchId?: string): Promise<Holiday | null>;
  findAll(organizationId: string, filter?: { year?: number; branchId?: string; isActive?: boolean }): Promise<Holiday[]>;
  saveMany(holidays: Holiday[]): Promise<void>;
}
