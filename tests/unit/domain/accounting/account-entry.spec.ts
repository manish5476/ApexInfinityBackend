import { AccountEntry } from '../../../../src/modules/accounting/domain/entities/AccountEntry';

describe('AccountEntry Entity', () => {
  it('should create a debit entry with 2 decimal normalization', () => {
    const entry = AccountEntry.create({
      id: 'entry-1',
      organizationId: 'org-1',
      accountId: 'acc-1',
      debit: 150.456,
      description: 'Opening balance',
      referenceNumber: 'ref-001',
    });

    expect(entry.id).toBe('entry-1');
    expect(entry.debit).toBe(150.46);
    expect(entry.credit).toBe(0);
    expect(entry.referenceNumber).toBe('REF-001');
  });

  it('should create a credit entry', () => {
    const entry = AccountEntry.create({
      id: 'entry-2',
      organizationId: 'org-1',
      accountId: 'acc-2',
      credit: 200,
      description: 'Payment receipt',
    });

    expect(entry.credit).toBe(200);
    expect(entry.debit).toBe(0);
  });

  it('should throw if both debit and credit are zero', () => {
    expect(() =>
      AccountEntry.create({
        id: 'entry-3',
        organizationId: 'org-1',
        accountId: 'acc-1',
        debit: 0,
        credit: 0,
      })
    ).toThrow('AccountEntry must have a non-zero debit or credit value');
  });

  it('should throw if both debit and credit are positive', () => {
    expect(() =>
      AccountEntry.create({
        id: 'entry-4',
        organizationId: 'org-1',
        accountId: 'acc-1',
        debit: 100,
        credit: 50,
      })
    ).toThrow('AccountEntry cannot be both debit');
  });
});
