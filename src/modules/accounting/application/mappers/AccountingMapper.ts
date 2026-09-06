import { Account } from '../../domain/entities/Account';
import { Invoice } from '../../domain/entities/Invoice';
import { Payment } from '../../domain/entities/Payment';
import { AccountEntry } from '../../domain/entities/AccountEntry';
import {
  AccountResponseDto,
  InvoiceResponseDto,
  PaymentResponseDto,
  LedgerEntryResponseDto,
} from '../dto/accounting.dto';

export class AccountingMapper {
  static toAccountDto(account: Account): AccountResponseDto {
    const p = account.props;
    return {
      id: account.id,
      organizationId: p.organizationId,
      code: p.code,
      name: p.name,
      type: p.type,
      parent: p.parent,
      isGroup: p.isGroup,
      cachedBalance: p.cachedBalance,
      isActive: p.isActive,
      metadata: p.metadata,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  static toInvoiceDto(invoice: Invoice): InvoiceResponseDto {
    const p = invoice.props;
    return {
      id: invoice.id,
      organizationId: p.organizationId,
      branchId: p.branchId,
      customerId: p.customerId,
      invoiceNumber: p.invoiceNumber,
      invoiceDate: p.invoiceDate.toISOString(),
      dueDate: p.dueDate ? p.dueDate.toISOString() : null,
      status: p.status,
      source: p.source,
      items: p.items.map(i => ({ ...i })),
      subTotal: p.subTotal,
      totalTax: p.totalTax,
      totalDiscount: p.totalDiscount,
      shippingCharges: p.shippingCharges,
      roundOff: p.roundOff,
      grandTotal: p.grandTotal,
      paymentStatus: p.paymentStatus,
      paidAmount: p.paidAmount,
      balanceAmount: p.balanceAmount,
      paymentMethod: p.paymentMethod,
      notes: p.notes,
      billingAddress: p.billingAddress,
      shippingAddress: p.shippingAddress,
      isDeleted: p.isDeleted ?? false,
      createdBy: p.createdBy,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  static toPaymentDto(payment: Payment): PaymentResponseDto {
    const p = payment.props;
    return {
      id: payment.id,
      organizationId: p.organizationId,
      branchId: p.branchId,
      type: p.type,
      customerId: p.customerId,
      supplierId: p.supplierId,
      invoiceId: p.invoiceId,
      purchaseId: p.purchaseId,
      paymentDate: p.paymentDate.toISOString(),
      referenceNumber: p.referenceNumber,
      amount: p.amount,
      remainingAmount: p.remainingAmount,
      paymentMethod: p.paymentMethod,
      transactionId: p.transactionId,
      bankName: p.bankName,
      remarks: p.remarks,
      status: p.status,
      allocationStatus: p.allocationStatus,
      allocatedTo: p.allocatedTo.map(a => ({ ...a })),
      isDeleted: p.isDeleted ?? false,
      createdBy: p.createdBy,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  static toLedgerEntryDto(entry: AccountEntry): LedgerEntryResponseDto {
    const p = entry.props;
    return {
      id: entry.id,
      organizationId: p.organizationId,
      branchId: p.branchId,
      accountId: p.accountId,
      customerId: p.customerId,
      supplierId: p.supplierId,
      invoiceId: p.invoiceId,
      purchaseId: p.purchaseId,
      paymentId: p.paymentId,
      date: p.date.toISOString(),
      debit: p.debit,
      credit: p.credit,
      description: p.description,
      referenceNumber: p.referenceNumber,
      referenceType: p.referenceType,
      createdBy: p.createdBy,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
