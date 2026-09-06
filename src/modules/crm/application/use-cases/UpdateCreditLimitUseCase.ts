import { ICustomerRepository } from '../../domain/ports/ICustomerRepository';
import { CustomerResponseDto } from '../dto/crm.dto';
import { CustomerMapper } from '../mappers/CustomerMapper';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';

export class UpdateCreditLimitUseCase {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(
    input: { id: string; creditLimit: number },
    context: { organizationId: string }
  ): Promise<{ customer: CustomerResponseDto; warning?: string }> {
    const customer = await this.customerRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    customer.updateCreditLimit(input.creditLimit);

    await this.uow.runInTransaction(async () => {
      await this.customerRepo.save(customer);
    });

    const warning =
      input.creditLimit > 0 && customer.guarantors.length === 0
        ? 'This customer has a credit limit but no guarantors on record. Consider adding a guarantor for security.'
        : undefined;

    return {
      customer: CustomerMapper.toDto(customer),
      ...(warning && { warning }),
    };
  }
}
