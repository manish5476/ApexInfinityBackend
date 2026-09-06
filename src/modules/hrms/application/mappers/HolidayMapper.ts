import { IMapper } from '../../../../core/application/IMapper';
import { Holiday, HolidayProps } from '../../domain/entities/Holiday';

export class HolidayMapper implements IMapper<Holiday, any, any> {
  public toDomain(raw: any): Holiday {
    const props: HolidayProps = {
      organizationId: raw.organizationId,
      branchId: raw.branchId || undefined,
      name: raw.name,
      date: new Date(raw.date),
      year: raw.year,
      description: raw.description || undefined,
      holidayType: raw.holidayType || 'company',
      isOptional: raw.isOptional ?? false,
      recurring: raw.recurring,
      isActive: raw.isActive ?? true,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
    return Holiday.reconstitute(raw._id || raw.id, props);
  }

  public toPersistence(domain: Holiday): Record<string, unknown> {
    return {
      _id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      name: domain.name,
      date: domain.date,
      year: domain.year,
      description: domain.description,
      holidayType: domain.holidayType,
      isOptional: domain.isOptional,
      recurring: domain.recurring,
      isActive: domain.isActive,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public toDto(domain: Holiday): any {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      name: domain.name,
      date: domain.date.toISOString(),
      year: domain.year,
      description: domain.description,
      holidayType: domain.holidayType,
      isOptional: domain.isOptional,
      recurring: domain.recurring,
      isActive: domain.isActive,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}
