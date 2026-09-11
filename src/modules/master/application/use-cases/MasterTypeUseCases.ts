import { v4 as uuidv4 } from 'uuid';
import { IMasterTypeRepository } from '../../domain/ports/IMasterTypeRepository';
import { MasterType } from '../../domain/entities/MasterType';
import { NotFoundError, ConflictError, ValidationError } from '../../../../shared/errors';

export class MasterTypeUseCases {
  constructor(private readonly repo: IMasterTypeRepository) {}

  async createType(params: { name: string; label: string; isActive?: boolean }): Promise<MasterType> {
    if (!params.name || !params.name.trim()) {
      throw new ValidationError('Name is required');
    }
    if (!params.label || !params.label.trim()) {
      throw new ValidationError('Label is required');
    }

    const existing = await this.repo.findByName(params.name.trim());
    if (existing) {
      throw new ConflictError(`Master type '${params.name}' already exists`);
    }

    const masterType = MasterType.create({
      id: uuidv4(),
      name: params.name,
      label: params.label,
      isActive: params.isActive,
    });

    await this.repo.save(masterType);
    return masterType;
  }

  async getTypes(query?: { isActive?: boolean }): Promise<MasterType[]> {
    return this.repo.list(query);
  }

  async getTypeById(id: string): Promise<MasterType> {
    const item = await this.repo.findById(id);
    if (!item) {
      throw new NotFoundError('MasterType', id);
    }
    return item;
  }

  async updateType(
    id: string,
    updates: Partial<{ name: string; label: string; isActive: boolean }>
  ): Promise<MasterType> {
    const item = await this.repo.findById(id);
    if (!item) {
      throw new NotFoundError('MasterType', id);
    }

    if (updates.name && updates.name.toLowerCase() !== item.name) {
      const existing = await this.repo.findByName(updates.name);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Master type '${updates.name}' already exists`);
      }
    }

    item.updateDetails(updates);
    await this.repo.save(item);
    return item;
  }

  async deleteType(id: string): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted) {
      throw new NotFoundError('MasterType', id);
    }
  }
}
