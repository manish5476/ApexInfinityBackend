import { ICustomerRepository } from '../../domain/ports/ICustomerRepository';
import { CustomerResponseDto } from '../dto/crm.dto';
import { CustomerMapper } from '../mappers/CustomerMapper';

export class SearchCustomersUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(
    input: { query: string; limit?: number },
    context: { organizationId: string }
  ): Promise<{ customers: CustomerResponseDto[]; count: number }> {
    const customers = await this.customerRepo.search({
      query: input.query,
      limit: input.limit,
      organizationId: context.organizationId,
    });

    const dtos = customers.map(c => CustomerMapper.toDto(c));

    return {
      customers: dtos,
      count: dtos.length,
    };
  }
}
