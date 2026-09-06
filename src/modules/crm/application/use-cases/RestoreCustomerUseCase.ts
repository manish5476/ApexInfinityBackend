import { ICustomerRepository } from '../../domain/ports/ICustomerRepository';
import { CustomerResponseDto } from '../dto/crm.dto';
import { CustomerMapper } from '../mappers/CustomerMapper';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';

export class RestoreCustomerUseCase {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(input: { id: string }, context: { organizationId: string }): Promise<CustomerResponseDto> {
    const customer = await this.customerRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    customer.restore();

    await this.uow.runInTransaction(async () => {
      await this.customerRepo.save(customer);
    });

    return CustomerMapper.toDto(customer);
  }
}
