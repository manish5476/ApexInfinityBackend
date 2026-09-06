import { IPurchaseOrderRepository } from '../../domain/ports/IPurchaseOrderRepository';
import { PurchaseOrderResponseDto } from '../dto/inventory.dto';
import { OrderMapper } from '../mappers/OrderMapper';

export class GetPurchaseOrderByIdUseCase {
  constructor(private readonly poRepo: IPurchaseOrderRepository) {}

  async execute(
    input: { id: string },
    context: { organizationId: string }
  ): Promise<PurchaseOrderResponseDto> {
    const po = await this.poRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!po) {
      throw new Error('Purchase order not found');
    }

    return OrderMapper.toPurchaseOrderDto(po);
  }
}
