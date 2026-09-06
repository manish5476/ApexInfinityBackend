import { ICustomerRepository } from '../../domain/ports/ICustomerRepository';
import { CustomerResponseDto } from '../dto/crm.dto';
import { CustomerStatus } from '../../domain/value-objects/CustomerStatus';
import { CustomerMapper } from '../mappers/CustomerMapper';

export interface ListCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus;
  isActive?: boolean;
}

export class ListCustomersUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(
    query: ListCustomersParams,
    context: { organizationId: string }
  ): Promise<{ data: CustomerResponseDto[]; total: number }> {
    const { data, total } = await this.customerRepo.list({
      organizationId: context.organizationId,
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
      isActive: query.isActive,
    });

    return {
      data: data.map(c => CustomerMapper.toDto(c)),
      total,
    };
  }
}

