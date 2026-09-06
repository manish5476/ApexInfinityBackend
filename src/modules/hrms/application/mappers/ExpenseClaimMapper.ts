import { IMapper } from '../../../../core/application/IMapper';
import { ExpenseClaim, ExpenseClaimProps } from '../../domain/entities/ExpenseClaim';

export class ExpenseClaimMapper implements IMapper<ExpenseClaim, any, any> {
  public toDomain(raw: any): ExpenseClaim {
    const props: ExpenseClaimProps = {
      organizationId: raw.organizationId,
      branchId: raw.branchId || undefined,
      userId: raw.userId,
      employeeId: raw.employeeId || undefined,
      claimNumber: raw.claimNumber,
      title: raw.title,
      currency: raw.currency || 'INR',
      items: (raw.items || []).map((i: any) => ({
        id: i._id || i.id,
        category: i.category,
        description: i.description || undefined,
        expenseDate: new Date(i.expenseDate),
        amount: i.amount,
        taxAmount: i.taxAmount || 0,
        receiptUrl: i.receiptUrl || undefined,
      })),
      totalAmount: raw.totalAmount,
      approvedAmount: raw.approvedAmount || 0,
      status: raw.status || 'draft',
      approvalFlow: (raw.approvalFlow || []).map((f: any) => ({
        approver: f.approver,
        level: f.level,
        status: f.status,
        comments: f.comments,
        actionAt: f.actionAt ? new Date(f.actionAt) : undefined,
      })),
      submittedAt: raw.submittedAt ? new Date(raw.submittedAt) : undefined,
      approvedBy: raw.approvedBy || undefined,
      approvedAt: raw.approvedAt ? new Date(raw.approvedAt) : undefined,
      reimbursedAt: raw.reimbursedAt ? new Date(raw.reimbursedAt) : undefined,
      payslipId: raw.payslipId || undefined,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
    return ExpenseClaim.reconstitute(raw._id || raw.id, props);
  }

  public toPersistence(domain: ExpenseClaim): Record<string, unknown> {
    return {
      _id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      userId: domain.userId,
      employeeId: domain.employeeId,
      claimNumber: domain.claimNumber,
      title: domain.title,
      currency: domain.currency,
      items: domain.items,
      totalAmount: domain.totalAmount,
      approvedAmount: domain.approvedAmount,
      status: domain.status,
      approvalFlow: domain.approvalFlow,
      submittedAt: domain.submittedAt,
      approvedBy: domain.approvedBy,
      approvedAt: domain.approvedAt,
      reimbursedAt: domain.reimbursedAt,
      payslipId: domain.payslipId,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public toDto(domain: ExpenseClaim): any {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      userId: domain.userId,
      employeeId: domain.employeeId,
      claimNumber: domain.claimNumber,
      title: domain.title,
      currency: domain.currency,
      items: domain.items.map((i) => ({
        ...i,
        expenseDate: i.expenseDate.toISOString(),
      })),
      totalAmount: domain.totalAmount,
      approvedAmount: domain.approvedAmount,
      status: domain.status,
      approvalFlow: domain.approvalFlow,
      submittedAt: domain.submittedAt?.toISOString(),
      approvedBy: domain.approvedBy,
      approvedAt: domain.approvedAt?.toISOString(),
      reimbursedAt: domain.reimbursedAt?.toISOString(),
      payslipId: domain.payslipId,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}
