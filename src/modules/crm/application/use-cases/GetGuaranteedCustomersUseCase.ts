import { ICustomerRepository } from '../../domain/ports/ICustomerRepository';
import { CustomerResponseDto } from '../dto/crm.dto';
import { CustomerMapper } from '../mappers/CustomerMapper';

export class GetGuaranteedCustomersUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(
    input: { guarantorId: string },
    context: { organizationId: string }
  ): Promise<{ guaranteedCustomers: CustomerResponseDto[]; count: number }> {
    const guarantor = await this.customerRepo.findById({
      id: input.guarantorId,
      organizationId: context.organizationId,
    });

    if (!guarantor) {
      throw new Error('Guarantor customer not found');
    }

    const customers = await this.customerRepo.findGuaranteedCustomers({
      guarantorId: input.guarantorId,
      organizationId: context.organizationId,
    });

    const dtos = customers.map(c => CustomerMapper.toDto(c));

    return {
      guaranteedCustomers: dtos,
      count: dtos.length,
    };
  }
}
