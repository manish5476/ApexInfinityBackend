import { IMapper } from '../../../../core/application/IMapper';
import { CompanyAsset, CompanyAssetProps } from '../../domain/entities/CompanyAsset';

export class CompanyAssetMapper implements IMapper<CompanyAsset, any, any> {
  public toDomain(raw: any): CompanyAsset {
    const props: CompanyAssetProps = {
      organizationId: raw.organizationId,
      branchId: raw.branchId || undefined,
      assetCode: raw.assetCode,
      name: raw.name,
      category: raw.category,
      serialNumber: raw.serialNumber || undefined,
      manufacturer: raw.manufacturer || undefined,
      model: raw.model || undefined,
      purchaseDate: raw.purchaseDate ? new Date(raw.purchaseDate) : undefined,
      purchaseCost: raw.purchaseCost,
      warrantyExpiresAt: raw.warrantyExpiresAt ? new Date(raw.warrantyExpiresAt) : undefined,
      condition: raw.condition || 'good',
      status: raw.status || 'available',
      assignedTo: raw.assignedTo || undefined,
      employeeRef: raw.employeeRef || undefined,
      assignedAt: raw.assignedAt ? new Date(raw.assignedAt) : undefined,
      returnedAt: raw.returnedAt ? new Date(raw.returnedAt) : undefined,
      assignmentHistory: raw.assignmentHistory || [],
      notes: raw.notes || undefined,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
    return CompanyAsset.reconstitute(raw._id || raw.id, props);
  }

  public toPersistence(domain: CompanyAsset): Record<string, unknown> {
    return {
      _id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      assetCode: domain.assetCode,
      name: domain.name,
      category: domain.category,
      serialNumber: domain.serialNumber,
      manufacturer: domain.manufacturer,
      model: domain.model,
      purchaseDate: domain.purchaseDate,
      purchaseCost: domain.purchaseCost,
      warrantyExpiresAt: domain.warrantyExpiresAt,
      condition: domain.condition,
      status: domain.status,
      assignedTo: domain.assignedTo,
      employeeRef: domain.employeeRef,
      assignedAt: domain.assignedAt,
      returnedAt: domain.returnedAt,
      assignmentHistory: domain.assignmentHistory,
      notes: domain.notes,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public toDto(domain: CompanyAsset): any {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      assetCode: domain.assetCode,
      name: domain.name,
      category: domain.category,
      serialNumber: domain.serialNumber,
      manufacturer: domain.manufacturer,
      model: domain.model,
      purchaseDate: domain.purchaseDate?.toISOString(),
      purchaseCost: domain.purchaseCost,
      warrantyExpiresAt: domain.warrantyExpiresAt?.toISOString(),
      condition: domain.condition,
      status: domain.status,
      assignedTo: domain.assignedTo,
      employeeRef: domain.employeeRef,
      assignedAt: domain.assignedAt?.toISOString(),
      returnedAt: domain.returnedAt?.toISOString(),
      assignmentHistory: domain.assignmentHistory,
      notes: domain.notes,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}
