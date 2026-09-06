import { ICustomerRepository } from '../../domain/ports/ICustomerRepository';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';

export class DeleteCustomerUseCase {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(input: { id: string }, context: { organizationId: string }): Promise<{ message: string }> {
    const customer = await this.customerRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    customer.softDelete();

    await this.uow.runInTransaction(async () => {
      await this.customerRepo.save(customer);
    });

    return { message: 'Customer deleted successfully.' };
  }
}
