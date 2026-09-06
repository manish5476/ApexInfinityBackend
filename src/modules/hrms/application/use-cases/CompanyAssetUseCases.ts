import { ICompanyAssetRepository } from '../../domain/ports/ICompanyAssetRepository';
import { CompanyAsset } from '../../domain/entities/CompanyAsset';
import { CompanyAssetMapper } from '../mappers/CompanyAssetMapper';
import { AssetCategory, AssetCondition } from '../../domain/value-objects/HrmsEnums';
import { NotFoundError, ConflictError } from '../../../../shared/errors';

export class CompanyAssetUseCases {
  constructor(
    private readonly assetRepo: ICompanyAssetRepository,
    private readonly assetMapper: CompanyAssetMapper
  ) {}

  public async create(
    organizationId: string,
    params: {
      assetCode: string;
      name: string;
      category: AssetCategory;
      branchId?: string;
      serialNumber?: string;
      manufacturer?: string;
      model?: string;
      purchaseDate?: Date;
      purchaseCost?: number;
      warrantyExpiresAt?: Date;
      condition?: AssetCondition;
      notes?: string;
    }
  ): Promise<any> {
    const existing = await this.assetRepo.findByCode(organizationId, params.assetCode);
    if (existing) throw new ConflictError(`Asset code '${params.assetCode}' already exists.`);

    const asset = CompanyAsset.create({
      organizationId,
      ...params,
    });

    await this.assetRepo.save(asset);
    return this.assetMapper.toDto(asset);
  }

  public async list(organizationId: string, filter?: { status?: string; category?: string; branchId?: string; search?: string }): Promise<any[]> {
    const assets = await this.assetRepo.findAll(organizationId, filter);
    return assets.map((a) => this.assetMapper.toDto(a));
  }

  public async getById(organizationId: string, id: string): Promise<any> {
    const asset = await this.assetRepo.findById({ id, organizationId });
    if (!asset) throw new NotFoundError('Asset', id);
    return this.assetMapper.toDto(asset);
  }

  public async update(
    organizationId: string,
    id: string,
    params: {
      name?: string;
      category?: AssetCategory;
      serialNumber?: string;
      manufacturer?: string;
      model?: string;
      purchaseDate?: Date;
      purchaseCost?: number;
      warrantyExpiresAt?: Date;
      condition?: AssetCondition;
      notes?: string;
    }
  ): Promise<any> {
    const asset = await this.assetRepo.findById({ id, organizationId });
    if (!asset) throw new NotFoundError('Asset', id);

    asset.updateDetails(params);
    await this.assetRepo.save(asset);
    return this.assetMapper.toDto(asset);
  }

  public async assign(
    organizationId: string,
    id: string,
    params: { userId: string; employeeId?: string; processedBy?: string; conditionOnIssue?: string; notes?: string }
  ): Promise<any> {
    const asset = await this.assetRepo.findById({ id, organizationId });
    if (!asset) throw new NotFoundError('Asset', id);

    asset.assign(params.userId, params.employeeId, params.processedBy, params.conditionOnIssue, params.notes);
    await this.assetRepo.save(asset);
    return this.assetMapper.toDto(asset);
  }

  public async return(
    organizationId: string,
    id: string,
    params?: { conditionOnReturn?: AssetCondition; notes?: string; processedBy?: string }
  ): Promise<any> {
    const asset = await this.assetRepo.findById({ id, organizationId });
    if (!asset) throw new NotFoundError('Asset', id);

    asset.return(params?.conditionOnReturn, params?.notes, params?.processedBy);
    await this.assetRepo.save(asset);
    return this.assetMapper.toDto(asset);
  }
}
