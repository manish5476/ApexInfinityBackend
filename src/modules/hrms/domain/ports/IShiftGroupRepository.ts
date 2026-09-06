import { ITenantRepository } from '../../../../core/domain/IRepository';
import { ShiftGroup } from '../entities/ShiftGroup';

export interface IShiftGroupRepository extends ITenantRepository<ShiftGroup, string> {
  findByCode(organizationId: string, code: string): Promise<ShiftGroup | null>;
  findAll(organizationId: string, filter?: { isActive?: boolean; search?: string }): Promise<ShiftGroup[]>;
}
