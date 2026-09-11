import { v4 as uuidv4 } from 'uuid';
import { IMasterRepository } from '../../domain/ports/IMasterRepository';
import { MasterItem, MasterItemProps } from '../../domain/entities/MasterItem';
import { NotFoundError, ConflictError, ValidationError } from '../../../../shared/errors';

export class MasterItemUseCases {
  constructor(private readonly masterRepo: IMasterRepository) {}

  async createMaster(
    organizationId: string,
    params: {
      type: string;
      name: string;
      code?: string | null;
      description?: string | null;
      imageUrl?: string | null;
      parentId?: string | null;
      isActive?: boolean;
      metadata?: Record<string, unknown>;
    }
  ): Promise<MasterItem> {
    if (!params.type || !params.type.trim()) {
      throw new ValidationError('Master type is required');
    }
    if (!params.name || !params.name.trim()) {
      throw new ValidationError('Master name is required');
    }

    const existing = await this.masterRepo.findByTypeAndName({
      organizationId,
      type: params.type,
      name: params.name,
    });
    if (existing) {
      throw new ConflictError(`A master item with name '${params.name}' already exists for type '${params.type}'`);
    }

    const item = MasterItem.create({
      id: uuidv4(),
      organizationId,
      ...params,
    });

    await this.masterRepo.save(item);
    return item;
  }

  async getMasters(
    organizationId: string,
    query: {
      type?: string;
      search?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
      parentId?: string | null;
    }
  ): Promise<{ data: MasterItem[]; total: number }> {
    return this.masterRepo.list({
      organizationId,
      ...query,
    });
  }

  async getMasterById(organizationId: string, id: string): Promise<MasterItem> {
    const item = await this.masterRepo.findById({ id, organizationId });
    if (!item) {
      throw new NotFoundError('MasterItem', id);
    }
    return item;
  }

  async updateMaster(
    organizationId: string,
    id: string,
    updates: Partial<MasterItemProps>
  ): Promise<MasterItem> {
    const item = await this.masterRepo.findById({ id, organizationId });
    if (!item) {
      throw new NotFoundError('MasterItem', id);
    }

    if (updates.name && updates.name !== item.name) {
      const type = updates.type || item.type;
      const existing = await this.masterRepo.findByTypeAndName({
        organizationId,
        type,
        name: updates.name,
      });
      if (existing && existing.id !== id) {
        throw new ConflictError(`Duplicate value: A record with this Name already exists for type '${type}'.`);
      }
    }

    item.updateDetails(updates);
    await this.masterRepo.save(item);
    return item;
  }

  async deleteMaster(organizationId: string, id: string): Promise<void> {
    const deleted = await this.masterRepo.delete({ id, organizationId });
    if (!deleted) {
      throw new NotFoundError('MasterItem', id);
    }
  }

  async bulkCreateMasters(
    organizationId: string,
    items: Array<{
      type: string;
      name: string;
      code?: string | null;
      description?: string | null;
      imageUrl?: string | null;
      parentId?: string | null;
    }>
  ): Promise<{ inserted: MasterItem[]; failed: Array<{ index: number; error: string }> }> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('Items must be a non-empty array');
    }

    const domainItems = items.map((item, idx) => {
      if (!item.type || !item.name) {
        throw new ValidationError(`Missing required fields at index ${idx}`);
      }
      return MasterItem.create({
        id: uuidv4(),
        organizationId,
        type: item.type,
        name: item.name,
        code: item.code,
        description: item.description,
        imageUrl: item.imageUrl,
        parentId: item.parentId,
      });
    });

    return this.masterRepo.saveMany(domainItems);
  }

  async bulkUpdateMasters(
    organizationId: string,
    items: Array<{ id: string; updates: Partial<MasterItemProps> }>
  ): Promise<number> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('Items must be a non-empty array');
    }
    return this.masterRepo.bulkUpdate(organizationId, items);
  }

  async bulkDeleteMasters(organizationId: string, ids: string[]): Promise<number> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('IDs must be a non-empty array');
    }
    return this.masterRepo.bulkDelete(organizationId, ids);
  }
}
