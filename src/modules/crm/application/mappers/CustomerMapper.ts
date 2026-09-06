import { Customer } from '../../domain/entities/Customer';
import { CustomerResponseDto, GuarantorEntryDto } from '../dto/crm.dto';
import { ICustomerRepository } from '../../domain/ports/ICustomerRepository';

export class CustomerMapper {
  static toDto(customer: Customer, populatedGuarantors?: Map<string, { name: string; phone: string | null }>): CustomerResponseDto {
    const props = customer.props;

    const guarantors: GuarantorEntryDto[] = (props.guarantors || []).map(g => {
      const info = populatedGuarantors?.get(g.customerId);
      return {
        customerId: g.customerId,
        customerName: info?.name,
        customerPhone: info?.phone ?? undefined,
        notes: g.notes,
        addedAt: g.addedAt.toISOString(),
        addedBy: g.addedBy,
      };
    });

    return {
      id: customer.id,
      organizationId: customer.organizationId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      altPhone: customer.altPhone,
      type: customer.type,
      contactPerson: customer.contactPerson,
      avatar: customer.avatar,
      gstNumber: customer.gstNumber,
      panNumber: customer.panNumber,
      billingAddress: customer.billingAddress,
      shippingAddress: customer.shippingAddress,
      openingBalance: customer.openingBalance,
      outstandingBalance: customer.outstandingBalance,
      creditLimit: customer.creditLimit,
      paymentTerms: customer.paymentTerms,
      notes: customer.notes,
      tags: customer.tags,
      guarantors,
      status: customer.status,
      isActive: customer.isActive,
      isDeleted: customer.isDeleted,
      ownerId: customer.ownerId,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }

  static async toDtoWithPopulatedGuarantors(
    customer: Customer,
    customerRepo: ICustomerRepository
  ): Promise<CustomerResponseDto> {
    const guarantorIds = customer.guarantors.map(g => g.customerId);
    if (!guarantorIds.length) {
      return this.toDto(customer);
    }

    const guarantorCustomers = await customerRepo.findByIds({
      ids: guarantorIds,
      organizationId: customer.organizationId,
    });

    const map = new Map<string, { name: string; phone: string | null }>();
    for (const gc of guarantorCustomers) {
      map.set(gc.id, { name: gc.name, phone: gc.phone });
    }

    return this.toDto(customer, map);
  }
}
