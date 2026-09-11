import { IMasterRepository } from '../../domain/ports/IMasterRepository';
import { MasterItem, MasterItemProps } from '../../domain/entities/MasterItem';
import { FwMaster } from '../persistence/master.model';

export class MongoMasterRepository implements IMasterRepository {
  private toEntity(doc: any): MasterItem {
    return MasterItem.reconstitute({
      id: doc._id.toString(),
      organizationId: doc.organizationId,
      type: doc.type,
      name: doc.name,
      slug: doc.slug,
      code: doc.code,
      description: doc.description,
      imageUrl: doc.imageUrl,
      parentId: doc.parentId,
      isActive: doc.isActive,
      metadata: doc.metadata || {},
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async findById(query: { id: string; organizationId: string }): Promise<MasterItem | null> {
    const doc = await FwMaster.findOne({ _id: query.id, organizationId: query.organizationId });
    return doc ? this.toEntity(doc) : null;
  }

  async findByTypeAndName(query: { organizationId: string; type: string; name: string }): Promise<MasterItem | null> {
    const doc = await FwMaster.findOne({
      organizationId: query.organizationId,
      type: query.type.toLowerCase(),
      name: new RegExp(`^${query.name.trim()}$`, 'i'),
    });
    return doc ? this.toEntity(doc) : null;
  }

  async findByTypeAndCode(query: { organizationId: string; type: string; code: string }): Promise<MasterItem | null> {
    const doc = await FwMaster.findOne({
      organizationId: query.organizationId,
      type: query.type.toLowerCase(),
      code: query.code.toUpperCase(),
    });
    return doc ? this.toEntity(doc) : null;
  }

  async save(master: MasterItem): Promise<void> {
    await FwMaster.findOneAndUpdate(
      { _id: master.id, organizationId: master.organizationId },
      {
        _id: master.id,
        organizationId: master.organizationId,
        type: master.type,
        name: master.name,
        slug: master.slug,
        code: master.code,
        description: master.description,
        imageUrl: master.imageUrl,
        parentId: master.parentId,
        isActive: master.isActive,
        metadata: master.metadata,
      },
      { upsert: true, new: true }
    );
  }

  async saveMany(
    masters: MasterItem[]
  ): Promise<{ inserted: MasterItem[]; failed: Array<{ index: number; error: string }> }> {
    const docs = masters.map((m) => ({
      _id: m.id,
      organizationId: m.organizationId,
      type: m.type,
      name: m.name,
      slug: m.slug,
      code: m.code,
      description: m.description,
      imageUrl: m.imageUrl,
      parentId: m.parentId,
      isActive: m.isActive,
      metadata: m.metadata,
    }));

    try {
      const inserted = await FwMaster.insertMany(docs, { ordered: false });
      return {
        inserted: inserted.map((d) => this.toEntity(d)),
        failed: [],
      };
    } catch (err: any) {
      const insertedDocs = err.insertedDocs || [];
      const writeErrors = err.writeErrors || [];

      return {
        inserted: insertedDocs.map((d: any) => this.toEntity(d)),
        failed: writeErrors.map((e: any) => ({
          index: e.index,
          error: e.errmsg || 'Duplicate key or validation error',
        })),
      };
    }
  }

  async list(query: {
    organizationId: string;
    type?: string;
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    parentId?: string | null;
  }): Promise<{ data: MasterItem[]; total: number }> {
    const filter: Record<string, any> = { organizationId: query.organizationId };

    if (query.type) {
      filter.type = query.type.toLowerCase();
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }
    if (query.parentId !== undefined) {
      filter.parentId = query.parentId;
    }
    if (query.search) {
      const escaped = query.search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { code: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
      ];
    }

    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 500);
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      FwMaster.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      FwMaster.countDocuments(filter),
    ]);

    return {
      data: docs.map((d) => this.toEntity(d)),
      total,
    };
  }

  async delete(query: { id: string; organizationId: string }): Promise<boolean> {
    const result = await FwMaster.findOneAndUpdate(
      { _id: query.id, organizationId: query.organizationId },
      { isActive: false }
    );
    return !!result;
  }

  async bulkUpdate(
    organizationId: string,
    items: Array<{ id: string; updates: Partial<MasterItemProps> }>
  ): Promise<number> {
    const operations = items.map((item) => ({
      updateOne: {
        filter: { _id: item.id, organizationId },
        update: { $set: item.updates },
      },
    }));

    if (operations.length === 0) return 0;
    const res = await FwMaster.bulkWrite(operations);
    return res.modifiedCount;
  }

  async bulkDelete(organizationId: string, ids: string[]): Promise<number> {
    const res = await FwMaster.updateMany(
      { _id: { $in: ids }, organizationId },
      { $set: { isActive: false } }
    );
    return res.modifiedCount;
  }
}
