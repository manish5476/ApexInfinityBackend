import { IAccountRepository } from '../../domain/ports/IAccountRepository';
import { UpdateAccountDto, AccountResponseDto } from '../dto/accounting.dto';
import { AccountingMapper } from '../mappers/AccountingMapper';

export class UpdateAccountUseCase {
  constructor(private readonly accountRepo: IAccountRepository) {}

  async execute(
    input: { id: string; data: UpdateAccountDto },
    context: { organizationId: string }
  ): Promise<AccountResponseDto> {
    const account = await this.accountRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!account) {
      throw new Error('Account not found');
    }

    account.update({
      name: input.data.name,
      type: input.data.type,
      isActive: input.data.isActive,
      metadata: input.data.metadata,
    });

    await this.accountRepo.save(account);

    return AccountingMapper.toAccountDto(account);
  }
}
