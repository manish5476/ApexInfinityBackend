import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { ICompanyAssetRepository } from '../../domain/ports/ICompanyAssetRepository';
import { CompanyAsset } from '../../domain/entities/CompanyAsset';
import { CompanyAssetDocument } from '../persistence/company-asset.model';
import { CompanyAssetMapper } from '../../application/mappers/CompanyAssetMapper';

export class MongoCompanyAssetRepository
  extends MongoBaseRepository<CompanyAsset, CompanyAssetDocument>
  implements ICompanyAssetRepository
{
  constructor(model: Model<CompanyAssetDocument>, mapper: CompanyAssetMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'name', 'assetCode', 'status', 'category']);
  }

  public async findByCode(organizationId: string, assetCode: string): Promise<CompanyAsset | null> {
    const doc = await this.model.findOne({ organizationId, assetCode: assetCode.toUpperCase() }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findByAssignedUser(organizationId: string, userId: string): Promise<CompanyAsset[]> {
    const docs = await this.model.find({ organizationId, assignedTo: userId }).sort({ assignedAt: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async findByEmployeeRef(organizationId: string, employeeRef: string): Promise<CompanyAsset[]> {
    const docs = await this.model.find({ organizationId, employeeRef }).sort({ assignedAt: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async findAll(organizationId: string, filter?: { status?: string; category?: string; branchId?: string; search?: string }): Promise<CompanyAsset[]> {
    const query: any = { organizationId };
    if (filter?.status) query.status = filter.status;
    if (filter?.category) query.category = filter.category;
    if (filter?.branchId) query.branchId = filter.branchId;
    if (filter?.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { assetCode: { $regex: filter.search, $options: 'i' } },
        { serialNumber: { $regex: filter.search, $options: 'i' } },
      ];
    }
    const docs = await this.model.find(query).sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }
}
