import { InMemoryAccountRepository } from '../../../../src/modules/accounting/infrastructure/repositories/InMemoryAccountRepository';
import { CreateAccountUseCase } from '../../../../src/modules/accounting/application/use-cases/CreateAccountUseCase';
import { ListAccountsUseCase } from '../../../../src/modules/accounting/application/use-cases/ListAccountsUseCase';
import { GetAccountByIdUseCase } from '../../../../src/modules/accounting/application/use-cases/GetAccountByIdUseCase';
import { UpdateAccountUseCase } from '../../../../src/modules/accounting/application/use-cases/UpdateAccountUseCase';
import { ReparentAccountUseCase } from '../../../../src/modules/accounting/application/use-cases/ReparentAccountUseCase';
import { GetAccountHierarchyUseCase } from '../../../../src/modules/accounting/application/use-cases/GetAccountHierarchyUseCase';
import { DeleteAccountUseCase } from '../../../../src/modules/accounting/application/use-cases/DeleteAccountUseCase';
import { AccountType } from '../../../../src/modules/accounting/domain/value-objects/AccountingEnums';

describe('Account Application Use Cases', () => {
  let accountRepo: InMemoryAccountRepository;
  const context = { organizationId: 'org-acc-test' };

  beforeEach(async () => {
    accountRepo = new InMemoryAccountRepository();
  });

  it('CreateAccountUseCase creates accounts and prevents duplicates', async () => {
    const uc = new CreateAccountUseCase(accountRepo);
    const parent = await uc.execute(
      { code: '1000', name: 'Current Assets', type: AccountType.ASSET, isGroup: true },
      context
    );
    expect(parent.code).toBe('1000');
    expect(parent.isGroup).toBe(true);

    const child = await uc.execute(
      { code: '1010', name: 'Cash on Hand', type: AccountType.ASSET, parent: parent.id },
      context
    );
    expect(child.parent).toBe(parent.id);

    // Duplicate code check
    await expect(
      uc.execute({ code: '1000', name: 'Duplicate Asset', type: AccountType.ASSET }, context)
    ).rejects.toThrow("Account code '1000' already exists");
  });

  it('GetAccountByIdUseCase, UpdateAccountUseCase, and ReparentAccountUseCase modify account', async () => {
    const createUc = new CreateAccountUseCase(accountRepo);
    const getUc = new GetAccountByIdUseCase(accountRepo);
    const updateUc = new UpdateAccountUseCase(accountRepo);
    const reparentUc = new ReparentAccountUseCase(accountRepo);

    const root1 = await createUc.execute({ code: '1000', name: 'Assets', type: AccountType.ASSET, isGroup: true }, context);
    const root2 = await createUc.execute({ code: '2000', name: 'Liabilities', type: AccountType.LIABILITY, isGroup: true }, context);
    const item = await createUc.execute({ code: '1010', name: 'Cash', type: AccountType.ASSET, parent: root1.id }, context);

    const retrieved = await getUc.execute({ id: item.id }, context);
    expect(retrieved.name).toBe('Cash');

    const updated = await updateUc.execute({ id: item.id, data: { name: 'Main Cash Drawer' } }, context);
    expect(updated.name).toBe('Main Cash Drawer');

    const reparented = await reparentUc.execute({ id: item.id, newParentId: root2.id }, context);
    expect(reparented.parent).toBe(root2.id);
  });

  it('GetAccountHierarchyUseCase returns hierarchical tree', async () => {
    const createUc = new CreateAccountUseCase(accountRepo);
    const hierarchyUc = new GetAccountHierarchyUseCase(accountRepo);

    const root = await createUc.execute({ code: '1000', name: 'Current Assets', type: AccountType.ASSET, isGroup: true }, context);
    await createUc.execute({ code: '1010', name: 'Bank', type: AccountType.ASSET, parent: root.id }, context);
    await createUc.execute({ code: '1020', name: 'Cash', type: AccountType.ASSET, parent: root.id }, context);

    const tree = await hierarchyUc.execute(context);
    expect(tree).toHaveLength(1);
    expect(tree[0]!.account.code).toBe('1000');
    expect(tree[0]!.children).toHaveLength(2);
  });

  it('DeleteAccountUseCase prevents deleting accounts with children', async () => {
    const createUc = new CreateAccountUseCase(accountRepo);
    const deleteUc = new DeleteAccountUseCase(accountRepo);

    const root = await createUc.execute({ code: '1000', name: 'Assets', type: AccountType.ASSET, isGroup: true }, context);
    const child = await createUc.execute({ code: '1010', name: 'Bank', type: AccountType.ASSET, parent: root.id }, context);

    await expect(deleteUc.execute({ id: root.id }, context)).rejects.toThrow('Cannot delete account with child accounts');

    // Deleting child first succeeds
    await deleteUc.execute({ id: child.id }, context);
    const res = await deleteUc.execute({ id: root.id }, context);
    expect(res.message).toBe('Account deleted successfully');
  });

  it('ListAccountsUseCase filters accounts by type and flags', async () => {
    const createUc = new CreateAccountUseCase(accountRepo);
    const listUc = new ListAccountsUseCase(accountRepo);

    await createUc.execute({ code: '1000', name: 'Assets', type: AccountType.ASSET }, context);
    await createUc.execute({ code: '4000', name: 'Sales Revenue', type: AccountType.REVENUE }, context);

    const assets = await listUc.execute({ type: AccountType.ASSET }, context);
    expect(assets.total).toBe(1);
    expect(assets.data[0]!.code).toBe('1000');
  });
});
