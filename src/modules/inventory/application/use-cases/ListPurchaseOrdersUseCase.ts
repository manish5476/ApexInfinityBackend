import { IPurchaseOrderRepository, ListPurchaseOrdersQuery } from '../../domain/ports/IPurchaseOrderRepository';
import { PurchaseOrderResponseDto } from '../dto/inventory.dto';
import { OrderMapper } from '../mappers/OrderMapper';

export class ListPurchaseOrdersUseCase {
  constructor(private readonly poRepo: IPurchaseOrderRepository) {}

  async execute(
    query: Omit<ListPurchaseOrdersQuery, 'organizationId'>,
    context: { organizationId: string }
  ): Promise<{ data: PurchaseOrderResponseDto[]; total: number }> {
    const result = await this.poRepo.list({
      organizationId: context.organizationId,
      branchId: query.branchId,
      supplierId: query.supplierId,
      status: query.status,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });

    return {
      data: result.data.map(po => OrderMapper.toPurchaseOrderDto(po)),
      total: result.total,
    };
  }
}
