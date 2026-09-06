import { IAccountRepository } from '../../domain/ports/IAccountRepository';
import { AccountResponseDto } from '../dto/accounting.dto';
import { AccountingMapper } from '../mappers/AccountingMapper';

export class GetAccountByIdUseCase {
  constructor(private readonly accountRepo: IAccountRepository) {}

  async execute(
    input: { id: string },
    context: { organizationId: string }
  ): Promise<AccountResponseDto> {
    const account = await this.accountRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!account) {
      throw new Error('Account not found');
    }

    return AccountingMapper.toAccountDto(account);
  }
}
