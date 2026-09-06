import { PurchaseOrder } from '../../domain/entities/PurchaseOrder';
import { SalesOrder } from '../../domain/entities/SalesOrder';
import { PurchaseOrderResponseDto, SalesOrderResponseDto } from '../dto/inventory.dto';

export class OrderMapper {
  static toPurchaseOrderDto(po: PurchaseOrder): PurchaseOrderResponseDto {
    const p = po.props;
    return {
      id: po.id,
      organizationId: p.organizationId,
      branchId: p.branchId,
      supplierId: p.supplierId,
      supplierName: p.supplierName,
      invoiceNumber: p.invoiceNumber,
      purchaseDate: p.purchaseDate.toISOString(),
      dueDate: p.dueDate ? p.dueDate.toISOString() : null,
      status: p.status,
      items: p.items.map(i => ({ ...i })),
      subTotal: p.subTotal,
      totalTax: p.totalTax,
      totalDiscount: p.totalDiscount,
      grandTotal: p.grandTotal,
      paymentStatus: p.paymentStatus,
      paidAmount: p.paidAmount,
      balanceAmount: p.balanceAmount,
      notes: p.notes,
      createdBy: p.createdBy,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  static toSalesOrderDto(so: SalesOrder): SalesOrderResponseDto {
    const p = so.props;
    return {
      id: so.id,
      organizationId: p.organizationId,
      branchId: p.branchId,
      customerId: p.customerId,
      invoiceId: p.invoiceId,
      status: p.status,
      items: p.items.map(i => ({ ...i })),
      subTotal: p.subTotal,
      totalTax: p.totalTax,
      totalDiscount: p.totalDiscount,
      grandTotal: p.grandTotal,
      paymentStatus: p.paymentStatus,
      paidAmount: p.paidAmount,
      balanceAmount: p.balanceAmount,
      notes: p.notes,
      createdBy: p.createdBy,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
