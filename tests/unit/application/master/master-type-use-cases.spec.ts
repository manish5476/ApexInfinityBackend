import { InMemoryMasterTypeRepository } from '../../../../src/modules/master/infrastructure/repositories/InMemoryMasterTypeRepository';
import { MasterTypeUseCases } from '../../../../src/modules/master/application/use-cases/MasterTypeUseCases';
import { ValidationError, ConflictError, NotFoundError } from '../../../../src/shared/errors';

describe('MasterTypeUseCases', () => {
  let repo: InMemoryMasterTypeRepository;
  let useCases: MasterTypeUseCases;

  beforeEach(() => {
    repo = new InMemoryMasterTypeRepository();
    useCases = new MasterTypeUseCases(repo);
  });

  describe('createType', () => {
    it('should create master type with lowercase normalized name', async () => {
      const type = await useCases.createType({
        name: 'Brand',
        label: 'Product Brands',
      });

      expect(type.id).toBeDefined();
      expect(type.name).toBe('brand');
      expect(type.label).toBe('Product Brands');
      expect(type.isActive).toBe(true);

      const fetched = await useCases.getTypeById(type.id);
      expect(fetched.id).toBe(type.id);
    });

    it('should reject invalid or missing name/label', async () => {
      await expect(useCases.createType({ name: '', label: 'Test' })).rejects.toThrow(ValidationError);
      await expect(useCases.createType({ name: 'test', label: '' })).rejects.toThrow(ValidationError);
    });

    it('should reject duplicate master type names', async () => {
      await useCases.createType({ name: 'category', label: 'Categories' });
      await expect(useCases.createType({ name: 'Category', label: 'Duplicate' })).rejects.toThrow(ConflictError);
    });
  });

  describe('getTypes and updateType', () => {
    it('should list all types and filter by isActive', async () => {
      await useCases.createType({ name: 'type1', label: 'Type 1', isActive: true });
      await useCases.createType({ name: 'type2', label: 'Type 2', isActive: false });

      const all = await useCases.getTypes();
      expect(all.length).toBe(2);

      const active = await useCases.getTypes({ isActive: true });
      expect(active.length).toBe(1);
      expect(active[0]?.name).toBe('type1');
    });

    it('should update master type details', async () => {
      const created = await useCases.createType({ name: 'unit', label: 'Measurement Units' });
      const updated = await useCases.updateType(created.id, { label: 'Units of Measure' });

      expect(updated.label).toBe('Units of Measure');
    });

    it('should soft delete master type by deactivating it', async () => {
      const created = await useCases.createType({ name: 'tag', label: 'Tags' });
      await useCases.deleteType(created.id);

      const fetched = await useCases.getTypeById(created.id);
      expect(fetched.isActive).toBe(false);
    });
  });
});
