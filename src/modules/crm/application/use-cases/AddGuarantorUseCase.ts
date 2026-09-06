import { ICustomerRepository } from '../../domain/ports/ICustomerRepository';
import { CustomerResponseDto } from '../dto/crm.dto';
import { CustomerMapper } from '../mappers/CustomerMapper';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';

export class AddGuarantorUseCase {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(
    input: { customerId: string; guarantorId: string; notes?: string; addedBy?: string },
    context: { organizationId: string }
  ): Promise<{ customer: CustomerResponseDto; message: string }> {
    if (input.guarantorId === input.customerId) {
      throw new Error('A customer cannot be their own guarantor');
    }

    const [customer, guarantor] = await Promise.all([
      this.customerRepo.findById({ id: input.customerId, organizationId: context.organizationId }),
      this.customerRepo.findById({ id: input.guarantorId, organizationId: context.organizationId }),
    ]);

    if (!customer) {
      throw new Error('Customer not found');
    }

    if (!guarantor || guarantor.isDeleted) {
      throw new Error('Guarantor customer not found in this organization');
    }

    customer.addGuarantor(input.guarantorId, input.notes, input.addedBy);

    await this.uow.runInTransaction(async () => {
      await this.customerRepo.save(customer);
    });

    return {
      customer: await CustomerMapper.toDtoWithPopulatedGuarantors(customer, this.customerRepo),
      message: `${guarantor.name} has been added as a guarantor.`,
    };
  }
}
