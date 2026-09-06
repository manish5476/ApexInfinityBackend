import { ITenantRepository } from '../../../../core/domain/IRepository';
import { CompanyAsset } from '../entities/CompanyAsset';

export interface ICompanyAssetRepository extends ITenantRepository<CompanyAsset, string> {
  findByCode(organizationId: string, assetCode: string): Promise<CompanyAsset | null>;
  findByAssignedUser(organizationId: string, userId: string): Promise<CompanyAsset[]>;
  findByEmployeeRef(organizationId: string, employeeRef: string): Promise<CompanyAsset[]>;
  findAll(organizationId: string, filter?: { status?: string; category?: string; branchId?: string; search?: string }): Promise<CompanyAsset[]>;
}
