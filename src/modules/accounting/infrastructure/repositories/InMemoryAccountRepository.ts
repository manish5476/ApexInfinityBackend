import { IAccountRepository, ListAccountsQuery, AccountHierarchyNode } from '../../domain/ports/IAccountRepository';
import { Account } from '../../domain/entities/Account';

export class InMemoryAccountRepository implements IAccountRepository {
  public accounts: Account[] = [];

  async findById(query: { id: string; organizationId: string }): Promise<Account | null> {
    const a = this.accounts.find(x => x.id === query.id && x.organizationId === query.organizationId);
    return a ? Account.reconstitute({ ...a.props, id: a.id }) : null;
  }

  async findByCode(query: { code: string; organizationId: string }): Promise<Account | null> {
    const a = this.accounts.find(
      x => x.code === query.code.toUpperCase().trim() && x.organizationId === query.organizationId
    );
    return a ? Account.reconstitute({ ...a.props, id: a.id }) : null;
  }

  async findByParent(query: { parentId: string; organizationId: string }): Promise<Account[]> {
    return this.accounts
      .filter(x => x.parent === query.parentId && x.organizationId === query.organizationId)
      .map(a => Account.reconstitute({ ...a.props, id: a.id }));
  }

  async save(account: Account): Promise<void> {
    const idx = this.accounts.findIndex(x => x.id === account.id);
    if (idx >= 0) {
      this.accounts[idx] = Account.reconstitute({ ...account.props, id: account.id });
    } else {
      this.accounts.push(Account.reconstitute({ ...account.props, id: account.id }));
    }
  }

  async list(query: ListAccountsQuery): Promise<{ data: Account[]; total: number }> {
    let filtered = this.accounts.filter(x => x.organizationId === query.organizationId);

    if (query.type) filtered = filtered.filter(x => x.type === query.type);
    if (query.parent !== undefined) filtered = filtered.filter(x => x.parent === query.parent);
    if (query.isGroup !== undefined) filtered = filtered.filter(x => x.isGroup === query.isGroup);
    if (query.isActive !== undefined) filtered = filtered.filter(x => x.isActive === query.isActive);

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const start = (page - 1) * limit;
    return {
      data: filtered.slice(start, start + limit).map(a => Account.reconstitute({ ...a.props, id: a.id })),
      total: filtered.length,
    };
  }

  async getHierarchy(query: { organizationId: string }): Promise<AccountHierarchyNode[]> {
    const all = this.accounts
      .filter(x => x.organizationId === query.organizationId && x.isActive)
      .map(a => Account.reconstitute({ ...a.props, id: a.id }));

    const buildTree = (parentId: string | null): AccountHierarchyNode[] => {
      return all
        .filter(a => a.parent === parentId)
        .map(a => ({
          account: a,
          children: buildTree(a.id),
        }));
    };

    return buildTree(null);
  }

  async delete(query: { id: string; organizationId: string }): Promise<void> {
    this.accounts = this.accounts.filter(x => !(x.id === query.id && x.organizationId === query.organizationId));
  }
}
