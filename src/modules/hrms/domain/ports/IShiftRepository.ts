import { ITenantRepository } from '../../../../core/domain/IRepository';
import { Shift } from '../entities/Shift';

export interface IShiftRepository extends ITenantRepository<Shift, string> {
  findByCode(organizationId: string, code: string): Promise<Shift | null>;
  findAll(organizationId: string, filter?: { isActive?: boolean; search?: string }): Promise<Shift[]>;
}
