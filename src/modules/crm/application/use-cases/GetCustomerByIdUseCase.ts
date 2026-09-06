import { ICustomerRepository } from '../../domain/ports/ICustomerRepository';
import { CustomerResponseDto } from '../dto/crm.dto';
import { CustomerMapper } from '../mappers/CustomerMapper';

export class GetCustomerByIdUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(
    input: { id: string; populateGuarantors?: boolean },
    context: { organizationId: string }
  ): Promise<{ customer: CustomerResponseDto; warning?: string }> {
    const customer = await this.customerRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const customerDto = input.populateGuarantors
      ? await CustomerMapper.toDtoWithPopulatedGuarantors(customer, this.customerRepo)
      : CustomerMapper.toDto(customer);

    const warning =
      customer.creditLimit > 0 && customer.guarantors.length === 0
        ? 'This customer has a credit limit but no guarantors on record. Consider adding a guarantor for security.'
        : undefined;

    return {
      customer: customerDto,
      ...(warning && { warning }),
    };
  }
}
