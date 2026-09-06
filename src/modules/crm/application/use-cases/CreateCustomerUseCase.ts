import { ICustomerRepository } from '../../domain/ports/ICustomerRepository';
import { Customer } from '../../domain/entities/Customer';
import { CreateCustomerDto } from '../dto/crm.dto';
import { randomUUID } from 'crypto';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';

export class CreateCustomerUseCase {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly eventBus: IEventBus,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(dto: CreateCustomerDto, context: { organizationId: string }): Promise<{ id: string }> {
    if (dto.email) {
      const existingEmail = await this.customerRepo.findByEmail({ email: dto.email, organizationId: context.organizationId });
      if (existingEmail) {
        throw new Error('Customer with this email already exists in this organization');
      }
    }

    if (dto.phone) {
      const existingPhone = await this.customerRepo.findByPhone({ phone: dto.phone, organizationId: context.organizationId });
      if (existingPhone) {
        throw new Error('Customer with this phone number already exists in this organization');
      }
    }

    const customer = Customer.create({
      id: randomUUID(),
      organizationId: context.organizationId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      altPhone: dto.altPhone,
      type: dto.type,
      contactPerson: dto.contactPerson,
      avatar: dto.avatar,
      gstNumber: dto.gstNumber,
      panNumber: dto.panNumber,
      billingAddress: dto.billingAddress,
      shippingAddress: dto.shippingAddress,
      openingBalance: dto.openingBalance ?? 0,
      creditLimit: dto.creditLimit ?? 0,
      paymentTerms: dto.paymentTerms,
      notes: dto.notes,
      tags: dto.tags,
      ownerId: dto.ownerId || null,
    });

    await this.uow.runInTransaction(async () => {
      await this.customerRepo.save(customer);
      for (const event of customer.domainEvents) {
        await this.eventBus.publishDomainEvent(event);
      }
      customer.clearDomainEvents();
    });

    return { id: customer.id };
  }
}

