import { Account } from '../../../../src/modules/accounting/domain/entities/Account';
import { AccountType } from '../../../../src/modules/accounting/domain/value-objects/AccountingEnums';

describe('Account Entity', () => {
  it('should create an account with normalized code and active status', () => {
    const account = Account.create({
      id: 'acc-1',
      organizationId: 'org-1',
      code: '  1000  ',
      name: 'Cash in Hand',
      type: AccountType.ASSET,
    });

    expect(account.id).toBe('acc-1');
    expect(account.code).toBe('1000');
    expect(account.name).toBe('Cash in Hand');
    expect(account.type).toBe(AccountType.ASSET);
    expect(account.isActive).toBe(true);
    expect(account.cachedBalance).toBe(0);
  });

  it('should prevent self as parent', () => {
    expect(() =>
      Account.create({
        id: 'acc-self',
        organizationId: 'org-1',
        code: '1001',
        name: 'Invalid Self Parent',
        type: AccountType.ASSET,
        parent: 'acc-self',
      })
    ).toThrow('An account cannot reference itself as its parent');
  });

  it('should update account properties', () => {
    const account = Account.create({
      id: 'acc-2',
      organizationId: 'org-1',
      code: '2000',
      name: 'Accounts Payable',
      type: AccountType.LIABILITY,
    });

    account.update({ name: 'Trade Payables', isActive: false });
    expect(account.name).toBe('Trade Payables');
    expect(account.isActive).toBe(false);

    expect(() => account.update({ name: '   ' })).toThrow('Account name cannot be empty');
  });

  it('should reparent account and prevent circular reference', () => {
    const account = Account.create({
      id: 'acc-child',
      organizationId: 'org-1',
      code: '1010',
      name: 'Petty Cash',
      type: AccountType.ASSET,
      parent: 'acc-parent-1',
    });

    account.reparent('acc-parent-2');
    expect(account.parent).toBe('acc-parent-2');

    expect(() => account.reparent('acc-child')).toThrow('An account cannot reference itself as its parent');
  });

  it('should update cached balance accurately', () => {
    const account = Account.create({
      id: 'acc-3',
      organizationId: 'org-1',
      code: '1020',
      name: 'Bank Account',
      type: AccountType.ASSET,
    });

    account.updateBalance(500.5);
    expect(account.cachedBalance).toBe(500.5);

    account.updateBalance(-200.25);
    expect(account.cachedBalance).toBe(300.25);
  });
});
