import { IMapper } from '../../../../core/application/IMapper';
import { SalaryStructure, SalaryStructureProps } from '../../domain/entities/SalaryStructure';

export class SalaryStructureMapper implements IMapper<SalaryStructure, any, any> {
  public toDomain(raw: any): SalaryStructure {
    const props: SalaryStructureProps = {
      organizationId: raw.organizationId,
      branchId: raw.branchId || undefined,
      userId: raw.userId,
      employeeId: raw.employeeId || undefined,
      structureCode: raw.structureCode || undefined,
      title: raw.title,
      currency: raw.currency || 'INR',
      payFrequency: raw.payFrequency || 'monthly',
      effectiveFrom: new Date(raw.effectiveFrom),
      effectiveTo: raw.effectiveTo ? new Date(raw.effectiveTo) : undefined,
      status: raw.status || 'draft',
      components: raw.components || [],
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
    return SalaryStructure.reconstitute(raw._id || raw.id, props);
  }

  public toPersistence(domain: SalaryStructure): Record<string, unknown> {
    return {
      _id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      userId: domain.userId,
      employeeId: domain.employeeId,
      structureCode: domain.structureCode,
      title: domain.title,
      currency: domain.currency,
      payFrequency: domain.payFrequency,
      effectiveFrom: domain.effectiveFrom,
      effectiveTo: domain.effectiveTo,
      status: domain.status,
      components: domain.components,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public toDto(domain: SalaryStructure): any {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      userId: domain.userId,
      employeeId: domain.employeeId,
      structureCode: domain.structureCode,
      title: domain.title,
      currency: domain.currency,
      payFrequency: domain.payFrequency,
      effectiveFrom: (domain.effectiveFrom ?? new Date()).toISOString(),
      effectiveTo: domain.effectiveTo?.toISOString(),
      status: domain.status,
      components: domain.components,
      grossMonthly: domain.grossMonthly,
      deductionTotal: domain.deductionTotal,
      netMonthly: domain.netMonthly,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}
