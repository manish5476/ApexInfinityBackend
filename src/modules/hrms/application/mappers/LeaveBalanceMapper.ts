import { IMapper } from '../../../../core/application/IMapper';
import { LeaveBalance, LeaveBalanceProps } from '../../domain/entities/LeaveBalance';

export class LeaveBalanceMapper implements IMapper<LeaveBalance, any, any> {
  public toDomain(raw: any): LeaveBalance {
    const props: LeaveBalanceProps = {
      organizationId: raw.organizationId,
      branchId: raw.branchId || undefined,
      userId: raw.userId,
      financialYear: raw.financialYear,
      casualLeave: raw.casualLeave || { total: 12, used: 0 },
      sickLeave: raw.sickLeave || { total: 10, used: 0 },
      earnedLeave: raw.earnedLeave || { total: 0, used: 0 },
      compensatoryOff: raw.compensatoryOff || { total: 0, used: 0 },
      paidLeave: raw.paidLeave || { total: 0, used: 0 },
      unpaidLeave: raw.unpaidLeave || { total: 9999, used: 0 },
      marriageLeave: raw.marriageLeave || { total: 0, used: 0 },
      paternityLeave: raw.paternityLeave || { total: 0, used: 0 },
      maternityLeave: raw.maternityLeave || { total: 84, used: 0 },
      bereavementLeave: raw.bereavementLeave || { total: 0, used: 0 },
      lastAccruedAt: raw.lastAccruedAt ? new Date(raw.lastAccruedAt) : undefined,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
    return LeaveBalance.reconstitute(raw._id || raw.id, props);
  }

  public toPersistence(domain: LeaveBalance): Record<string, unknown> {
    return {
      _id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      userId: domain.userId,
      financialYear: domain.financialYear,
      casualLeave: domain.casualLeave,
      sickLeave: domain.sickLeave,
      earnedLeave: domain.earnedLeave,
      compensatoryOff: domain.compensatoryOff,
      paidLeave: domain.paidLeave,
      unpaidLeave: domain.unpaidLeave,
      marriageLeave: domain.marriageLeave,
      paternityLeave: domain.paternityLeave,
      maternityLeave: domain.maternityLeave,
      bereavementLeave: domain.bereavementLeave,
      lastAccruedAt: domain.lastAccruedAt,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public toDto(domain: LeaveBalance): any {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      userId: domain.userId,
      financialYear: domain.financialYear,
      casualLeave: domain.casualLeave,
      sickLeave: domain.sickLeave,
      earnedLeave: domain.earnedLeave,
      compensatoryOff: domain.compensatoryOff,
      paidLeave: domain.paidLeave,
      unpaidLeave: domain.unpaidLeave,
      marriageLeave: domain.marriageLeave,
      paternityLeave: domain.paternityLeave,
      maternityLeave: domain.maternityLeave,
      bereavementLeave: domain.bereavementLeave,
      lastAccruedAt: domain.lastAccruedAt?.toISOString(),
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}
