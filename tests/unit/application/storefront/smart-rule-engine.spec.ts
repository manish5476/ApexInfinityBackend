import { SmartRuleEngine } from '../../../../src/modules/storefront/application/services/SmartRuleEngine';

describe('SmartRuleEngine', () => {
  let engine: SmartRuleEngine;

  beforeEach(() => {
    engine = new SmartRuleEngine();
  });

  it('should build mongo query with default active filters', () => {
    const query = engine.buildMongoQuery('org-123', []);
    expect(query.organizationId).toBe('org-123');
    expect(query.status).toBe('active');
    expect(query.storefrontVisible).toBe(true);
    expect(query.isDeleted).toBe(false);
  });

  it('should translate comparison operators correctly', () => {
    const query = engine.buildMongoQuery('org-123', [
      { field: 'sellingPrice', operator: 'gte', value: 100 },
      { field: 'sellingPrice', operator: 'lte', value: 500 },
      { field: 'categoryId', operator: 'eq', value: 'cat-fashion' },
      { field: 'name', operator: 'contains', value: 'shoes' },
    ]);

    expect(query.organizationId).toBe('org-123');
    expect(query.sellingPrice).toEqual({ $gte: 100, $lte: 500 });
    expect(query.categoryId).toBe('cat-fashion');
    expect(query.name).toEqual({ $regex: 'shoes', $options: 'i' });
  });

  it('should translate between operator', () => {
    const query = engine.buildMongoQuery('org-123', [
      { field: 'sellingPrice', operator: 'between', value: 50, value2: 150 },
    ]);

    expect(query.sellingPrice).toEqual({ $gte: 50, $lte: 150 });
  });

  it('should translate in/nin operators', () => {
    const query = engine.buildMongoQuery('org-123', [
      { field: 'brandId', operator: 'in', value: ['nike', 'adidas'] },
    ]);

    expect(query.brandId).toEqual({ $in: ['nike', 'adidas'] });
  });
});
