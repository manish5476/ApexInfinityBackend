import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { IGeoFenceRepository } from '../../domain/ports/IGeoFenceRepository';
import { GeoFence } from '../../domain/entities/GeoFence';
import { GeoFenceDocument } from '../persistence/geofence.model';
import { GeoFenceMapper } from '../../application/mappers/GeoFenceMapper';

export class MongoGeoFenceRepository
  extends MongoBaseRepository<GeoFence, GeoFenceDocument>
  implements IGeoFenceRepository
{
  constructor(model: Model<GeoFenceDocument>, mapper: GeoFenceMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'name']);
  }

  public async findAll(organizationId: string, filter?: { isActive?: boolean; branchId?: string }): Promise<GeoFence[]> {
    const query: any = { organizationId };
    if (filter?.isActive !== undefined) query.isActive = filter.isActive;
    if (filter?.branchId) query.branchId = filter.branchId;
    const docs = await this.model.find(query).sort({ name: 1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }
}
