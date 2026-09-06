import { ICustomerRepository } from '../../domain/ports/ICustomerRepository';
import { UpdateCustomerDto, CustomerResponseDto } from '../dto/crm.dto';
import { CustomerMapper } from '../mappers/CustomerMapper';
import { CustomerStatus } from '../../domain/value-objects/CustomerStatus';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';

export class UpdateCustomerUseCase {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(
    input: { id: string; data: UpdateCustomerDto },
    context: { organizationId: string }
  ): Promise<CustomerResponseDto> {
    const customer = await this.customerRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const { data } = input;

    if (data.email && data.email.toLowerCase().trim() !== (customer.email || '').toLowerCase().trim()) {
      const existing = await this.customerRepo.findByEmail({
        email: data.email,
        organizationId: context.organizationId,
      });
      if (existing && existing.id !== customer.id) {
        throw new Error('Customer with this email already exists in this organization');
      }
    }

    if (data.phone && data.phone.trim() !== (customer.phone || '').trim()) {
      const existing = await this.customerRepo.findByPhone({
        phone: data.phone,
        organizationId: context.organizationId,
      });
      if (existing && existing.id !== customer.id) {
        throw new Error('Customer with this phone number already exists in this organization');
      }
    }

    customer.updateDetails({
      name: data.name,
      email: data.email,
      phone: data.phone,
      altPhone: data.altPhone,
      type: data.type,
      contactPerson: data.contactPerson,
      avatar: data.avatar,
      gstNumber: data.gstNumber,
      panNumber: data.panNumber,
      billingAddress: data.billingAddress,
      shippingAddress: data.shippingAddress,
      paymentTerms: data.paymentTerms,
      notes: data.notes,
      tags: data.tags,
      ownerId: data.ownerId,
    });

    if (data.status) {
      customer.changeStatus(data.status.toUpperCase() as CustomerStatus);
    }

    await this.uow.runInTransaction(async () => {
      await this.customerRepo.save(customer);
    });

    return CustomerMapper.toDto(customer);
  }
}
