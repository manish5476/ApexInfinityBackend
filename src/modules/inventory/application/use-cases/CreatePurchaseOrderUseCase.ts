import { IPurchaseOrderRepository } from '../../domain/ports/IPurchaseOrderRepository';
import { PurchaseOrder } from '../../domain/entities/PurchaseOrder';
import { randomUUID } from 'crypto';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';

export interface CreatePurchaseOrderDto {
  branchId: string;
  supplierId: string;
  supplierName?: string | null;
  invoiceNumber?: string | null;
  dueDate?: Date | null;
  items: Array<{ productId: string; name: string; quantity: number; purchasePrice: number; taxRate?: number; discount?: number }>;
  notes?: string | null;
  createdBy?: string | null;
}

export class CreatePurchaseOrderUseCase {
  constructor(
    private readonly poRepo: IPurchaseOrderRepository,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(dto: CreatePurchaseOrderDto, context: { organizationId: string }): Promise<{ id: string; grandTotal: number; status: string }> {
    const po = PurchaseOrder.create({
      id: randomUUID(),
      organizationId: context.organizationId,
      branchId: dto.branchId,
      supplierId: dto.supplierId,
      supplierName: dto.supplierName,
      invoiceNumber: dto.invoiceNumber,
      dueDate: dto.dueDate,
      items: dto.items.map(i => ({ ...i, taxRate: i.taxRate ?? 0, discount: i.discount ?? 0 })),
      notes: dto.notes,
      createdBy: dto.createdBy,
    });

    await this.uow.runInTransaction(async () => {
      await this.poRepo.save(po);
    });

    return { id: po.id, grandTotal: po.grandTotal, status: po.status };
  }
}
