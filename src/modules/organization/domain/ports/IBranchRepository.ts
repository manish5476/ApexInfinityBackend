import { Branch } from '../entities/Branch';

export interface IBranchRepository {
  findById(query: { id: string; organizationId: string }): Promise<Branch | null>;
  findByCode(query: { branchCode: string; organizationId: string }): Promise<Branch | null>;
  findMainBranch(query: { organizationId: string }): Promise<Branch | null>;
  save(branch: Branch): Promise<Branch>;
  delete(query: { id: string; organizationId: string }): Promise<boolean>;
  list(query: {
    organizationId: string;
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }): Promise<{ data: Branch[]; total: number }>;
}
