import { ISalesOrderRepository } from '../../domain/ports/ISalesOrderRepository';
import { SalesOrderResponseDto } from '../dto/inventory.dto';
import { OrderMapper } from '../mappers/OrderMapper';

export class GetSalesOrderByIdUseCase {
  constructor(private readonly soRepo: ISalesOrderRepository) {}

  async execute(
    input: { id: string },
    context: { organizationId: string }
  ): Promise<SalesOrderResponseDto> {
    const so = await this.soRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!so) {
      throw new Error('Sales order not found');
    }

    return OrderMapper.toSalesOrderDto(so);
  }
}
