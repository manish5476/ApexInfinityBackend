import { IAccountRepository, ListAccountsQuery, AccountHierarchyNode } from '../../domain/ports/IAccountRepository';
import { Account } from '../../domain/entities/Account';
import { AccountModel, IAccountDoc } from '../persistence/account.model';
import { AccountType } from '../../domain/value-objects/AccountingEnums';

export class MongoAccountRepository implements IAccountRepository {
  async findById(query: { id: string; organizationId: string }): Promise<Account | null> {
    const doc = await AccountModel.findOne({ _id: query.id, organizationId: query.organizationId }).lean<IAccountDoc>();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async findByCode(query: { code: string; organizationId: string }): Promise<Account | null> {
    const doc = await AccountModel.findOne({
      code: query.code.toUpperCase().trim(),
      organizationId: query.organizationId,
    }).lean<IAccountDoc>();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async findByParent(query: { parentId: string; organizationId: string }): Promise<Account[]> {
    const docs = await AccountModel.find({
      parent: query.parentId,
      organizationId: query.organizationId,
    }).lean<IAccountDoc[]>();

    return docs.map(d => this.mapToDomain(d));
  }

  async save(account: Account): Promise<void> {
    await AccountModel.updateOne(
      { _id: account.id, organizationId: account.organizationId },
      { $set: account.props },
      { upsert: true }
    );
  }

  async list(query: ListAccountsQuery): Promise<{ data: Account[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      organizationId: query.organizationId,
    };

    if (query.type) filter.type = query.type;
    if (query.parent !== undefined) filter.parent = query.parent;
    if (query.isGroup !== undefined) filter.isGroup = query.isGroup;
    if (query.isActive !== undefined) filter.isActive = query.isActive;

    const [docs, total] = await Promise.all([
      AccountModel.find(filter).sort({ code: 1 }).skip(skip).limit(limit).lean<IAccountDoc[]>(),
      AccountModel.countDocuments(filter),
    ]);

    return {
      data: docs.map(d => this.mapToDomain(d)),
      total,
    };
  }

  async getHierarchy(query: { organizationId: string }): Promise<AccountHierarchyNode[]> {
    const docs = await AccountModel.find({
      organizationId: query.organizationId,
      isActive: true,
    })
      .sort({ code: 1 })
      .lean<IAccountDoc[]>();

    const all = docs.map(d => this.mapToDomain(d));

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
    await AccountModel.deleteOne({ _id: query.id, organizationId: query.organizationId });
  }

  private mapToDomain(doc: IAccountDoc): Account {
    return Account.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      code: doc.code,
      name: doc.name,
      type: doc.type as AccountType,
      parent: doc.parent,
      isGroup: doc.isGroup,
      cachedBalance: doc.cachedBalance,
      isActive: doc.isActive,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
