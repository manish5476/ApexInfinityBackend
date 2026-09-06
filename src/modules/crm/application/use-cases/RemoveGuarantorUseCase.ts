import { ICustomerRepository } from '../../domain/ports/ICustomerRepository';
import { CustomerResponseDto } from '../dto/crm.dto';
import { CustomerMapper } from '../mappers/CustomerMapper';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';

export class RemoveGuarantorUseCase {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(
    input: { customerId: string; guarantorId: string },
    context: { organizationId: string }
  ): Promise<{ customer: CustomerResponseDto; message: string }> {
    const customer = await this.customerRepo.findById({
      id: input.customerId,
      organizationId: context.organizationId,
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    customer.removeGuarantor(input.guarantorId);

    await this.uow.runInTransaction(async () => {
      await this.customerRepo.save(customer);
    });

    return {
      customer: await CustomerMapper.toDtoWithPopulatedGuarantors(customer, this.customerRepo),
      message: 'Guarantor removed successfully.',
    };
  }
}
