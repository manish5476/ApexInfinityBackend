import { ISalesOrderRepository, ListSalesOrdersQuery } from '../../domain/ports/ISalesOrderRepository';
import { SalesOrderResponseDto } from '../dto/inventory.dto';
import { OrderMapper } from '../mappers/OrderMapper';

export class ListSalesOrdersUseCase {
  constructor(private readonly soRepo: ISalesOrderRepository) {}

  async execute(
    query: Omit<ListSalesOrdersQuery, 'organizationId'>,
    context: { organizationId: string }
  ): Promise<{ data: SalesOrderResponseDto[]; total: number }> {
    const result = await this.soRepo.list({
      organizationId: context.organizationId,
      branchId: query.branchId,
      customerId: query.customerId,
      status: query.status,
      page: query.page ?? 1,
      limit: query.limit ?? 20,
    });

    return {
      data: result.data.map(so => OrderMapper.toSalesOrderDto(so)),
      total: result.total,
    };
  }
}
