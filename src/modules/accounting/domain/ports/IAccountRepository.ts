import { Account } from '../entities/Account';
import { AccountType } from '../value-objects/AccountingEnums';

export interface ListAccountsQuery {
  organizationId: string;
  type?: AccountType;
  parent?: string | null;
  isGroup?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface AccountHierarchyNode {
  account: Account;
  children: AccountHierarchyNode[];
}

export interface IAccountRepository {
  findById(query: { id: string; organizationId: string }): Promise<Account | null>;
  findByCode(query: { code: string; organizationId: string }): Promise<Account | null>;
  findByParent(query: { parentId: string; organizationId: string }): Promise<Account[]>;
  save(account: Account): Promise<void>;
  list(query: ListAccountsQuery): Promise<{ data: Account[]; total: number }>;
  getHierarchy(query: { organizationId: string }): Promise<AccountHierarchyNode[]>;
  delete(query: { id: string; organizationId: string }): Promise<void>;
}
