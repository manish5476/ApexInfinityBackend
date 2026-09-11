import { InMemoryMasterRepository } from '../../../../src/modules/master/infrastructure/repositories/InMemoryMasterRepository';
import { MasterItemUseCases } from '../../../../src/modules/master/application/use-cases/MasterItemUseCases';
import { ValidationError, ConflictError, NotFoundError } from '../../../../src/shared/errors';

describe('MasterItemUseCases', () => {
  let repo: InMemoryMasterRepository;
  let useCases: MasterItemUseCases;
  const orgId = 'org-master-test';

  beforeEach(() => {
    repo = new InMemoryMasterRepository();
    useCases = new MasterItemUseCases(repo);
  });

  describe('createMaster', () => {
    it('should successfully create a master item with auto slug', async () => {
      const item = await useCases.createMaster(orgId, {
        type: 'brand',
        name: 'Apple Inc.',
        code: 'AAPL',
        description: 'Tech electronics',
      });

      expect(item.id).toBeDefined();
      expect(item.organizationId).toBe(orgId);
      expect(item.type).toBe('brand');
      expect(item.name).toBe('Apple Inc.');
      expect(item.slug).toMatch(/^apple-inc-[a-z0-9]+$/);
      expect(item.code).toBe('AAPL');
      expect(item.isActive).toBe(true);

      const fetched = await useCases.getMasterById(orgId, item.id);
      expect(fetched.id).toBe(item.id);
    });

    it('should throw ValidationError if type or name is missing', async () => {
      await expect(
        useCases.createMaster(orgId, { type: '', name: 'Test' })
      ).rejects.toThrow(ValidationError);

      await expect(
        useCases.createMaster(orgId, { type: 'brand', name: '  ' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ConflictError if master item with same type and name exists', async () => {
      await useCases.createMaster(orgId, {
        type: 'brand',
        name: 'Samsung',
      });

      await expect(
        useCases.createMaster(orgId, {
          type: 'brand',
          name: 'Samsung',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('getMasters', () => {
    beforeEach(async () => {
      await useCases.createMaster(orgId, { type: 'category', name: 'Electronics' });
      await useCases.createMaster(orgId, { type: 'category', name: 'Furniture' });
      await useCases.createMaster(orgId, { type: 'unit', name: 'Kilogram', code: 'KG' });
      await useCases.createMaster('other-org', { type: 'category', name: 'Groceries' });
    });

    it('should filter items by organization and type', async () => {
      const result = await useCases.getMasters(orgId, { type: 'category' });
      expect(result.total).toBe(2);
      expect(result.data.every((i) => i.type === 'category' && i.organizationId === orgId)).toBe(true);
    });

    it('should support search and pagination', async () => {
      const result = await useCases.getMasters(orgId, { search: 'elec' });
      expect(result.total).toBe(1);
      expect(result.data[0]?.name).toBe('Electronics');
    });
  });

  describe('updateMaster', () => {
    it('should update master properties and re-slugify if name changes', async () => {
      const item = await useCases.createMaster(orgId, {
        type: 'tag',
        name: 'Summer Sale',
      });

      const updated = await useCases.updateMaster(orgId, item.id, {
        name: 'Winter Clearance',
        description: 'End of year deals',
      });

      expect(updated.name).toBe('Winter Clearance');
      expect(updated.slug).toMatch(/^summer-sale-[a-z0-9]+$/);
      expect(updated.description).toBe('End of year deals');
    });

    it('should throw ConflictError if updated name clashes with existing item of same type', async () => {
      await useCases.createMaster(orgId, { type: 'tag', name: 'Hot Deals' });
      const item2 = await useCases.createMaster(orgId, { type: 'tag', name: 'Flash Sale' });

      await expect(
        useCases.updateMaster(orgId, item2.id, { name: 'Hot Deals' })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('deleteMaster', () => {
    it('should soft delete master item by deactivating it', async () => {
      const item = await useCases.createMaster(orgId, { type: 'tag', name: 'To Delete' });
      await useCases.deleteMaster(orgId, item.id);

      const fetched = await useCases.getMasterById(orgId, item.id);
      expect(fetched.isActive).toBe(false);
    });
  });

  describe('bulkCreateMasters', () => {
    it('should bulk insert valid items and skip duplicates', async () => {
      await useCases.createMaster(orgId, { type: 'brand', name: 'Sony' });

      const res = await useCases.bulkCreateMasters(orgId, [
        { type: 'brand', name: 'Sony' }, // duplicate
        { type: 'brand', name: 'LG' },
        { type: 'brand', name: 'Panasonic' },
      ]);

      expect(res.inserted.length).toBe(2);
      expect(res.failed.length).toBe(1);
      expect(res.failed[0]?.error).toContain('Sony');
    });

    it('should reject empty arrays', async () => {
      await expect(useCases.bulkCreateMasters(orgId, [])).rejects.toThrow(ValidationError);
    });
  });

  describe('bulkUpdateMasters and bulkDeleteMasters', () => {
    it('should bulk update masters', async () => {
      const item1 = await useCases.createMaster(orgId, { type: 'unit', name: 'Box' });
      const item2 = await useCases.createMaster(orgId, { type: 'unit', name: 'Carton' });

      const updatedCount = await useCases.bulkUpdateMasters(orgId, [
        { id: item1.id, updates: { description: 'Standard box' } },
        { id: item2.id, updates: { description: 'Heavy carton' } },
      ]);

      expect(updatedCount).toBe(2);

      const f1 = await useCases.getMasterById(orgId, item1.id);
      expect(f1.description).toBe('Standard box');
    });

    it('should bulk delete masters', async () => {
      const item1 = await useCases.createMaster(orgId, { type: 'unit', name: 'Dozen' });
      const item2 = await useCases.createMaster(orgId, { type: 'unit', name: 'Gross' });

      const count = await useCases.bulkDeleteMasters(orgId, [item1.id, item2.id]);
      expect(count).toBe(2);

      const f1 = await useCases.getMasterById(orgId, item1.id);
      expect(f1.isActive).toBe(false);
      const f2 = await useCases.getMasterById(orgId, item2.id);
      expect(f2.isActive).toBe(false);
    });
  });
});
