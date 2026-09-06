import { ICustomerRepository } from '../../domain/ports/ICustomerRepository';
import { CheckDuplicateQueryDto } from '../dto/crm.dto';

export interface CheckDuplicateResult {
  isDuplicate: boolean;
  existingCustomer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

export class CheckDuplicateCustomerUseCase {
  constructor(private readonly customerRepo: ICustomerRepository) {}

  async execute(
    input: CheckDuplicateQueryDto,
    context: { organizationId: string }
  ): Promise<CheckDuplicateResult> {
    const existing = await this.customerRepo.checkDuplicate({
      organizationId: context.organizationId,
      email: input.email,
      phone: input.phone,
      gstNumber: input.gstNumber,
      name: input.name,
    });

    if (!existing) {
      return {
        isDuplicate: false,
        existingCustomer: null,
      };
    }

    return {
      isDuplicate: true,
      existingCustomer: {
        id: existing.id,
        name: existing.name,
        email: existing.email,
        phone: existing.phone,
      },
    };
  }
}
