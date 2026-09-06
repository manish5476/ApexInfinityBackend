import { IBranchRepository } from '../../domain/ports/IBranchRepository';
import { Branch } from '../../domain/entities/Branch';

export class InMemoryBranchRepository implements IBranchRepository {
  public branches: Branch[] = [];

  async findById(query: { id: string; organizationId: string }): Promise<Branch | null> {
    const b = this.branches.find((x) => x.id === query.id && x.organizationId === query.organizationId);
    return b ? Branch.reconstitute({ ...b.props, id: b.id }) : null;
  }

  async findByCode(query: { branchCode: string; organizationId: string }): Promise<Branch | null> {
    const b = this.branches.find(
      (x) => x.branchCode.toUpperCase() === query.branchCode.toUpperCase() && x.organizationId === query.organizationId
    );
    return b ? Branch.reconstitute({ ...b.props, id: b.id }) : null;
  }

  async findMainBranch(query: { organizationId: string }): Promise<Branch | null> {
    const b = this.branches.find((x) => x.isMainBranch && x.organizationId === query.organizationId);
    return b ? Branch.reconstitute({ ...b.props, id: b.id }) : null;
  }

  async save(branch: Branch): Promise<Branch> {
    const idx = this.branches.findIndex((x) => x.id === branch.id);
    if (idx >= 0) {
      this.branches[idx] = Branch.reconstitute({ ...branch.props, id: branch.id });
    } else {
      this.branches.push(Branch.reconstitute({ ...branch.props, id: branch.id }));
    }
    return branch;
  }

  async delete(query: { id: string; organizationId: string }): Promise<boolean> {
    const initialLen = this.branches.length;
    this.branches = this.branches.filter((x) => !(x.id === query.id && x.organizationId === query.organizationId));
    return this.branches.length < initialLen;
  }

  async list(query: {
    organizationId: string;
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }): Promise<{ data: Branch[]; total: number }> {
    let filtered = this.branches.filter((x) => x.organizationId === query.organizationId);

    if (query.isActive !== undefined) {
      filtered = filtered.filter((x) => x.isActive === query.isActive);
    }
    if (query.search) {
      const q = query.search.toLowerCase();
      filtered = filtered.filter((x) => x.name.toLowerCase().includes(q) || x.branchCode.toLowerCase().includes(q));
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;

    return {
      data: filtered.slice(start, start + limit).map((b) => Branch.reconstitute({ ...b.props, id: b.id })),
      total: filtered.length,
    };
  }

  clear(): void {
    this.branches = [];
  }
}
