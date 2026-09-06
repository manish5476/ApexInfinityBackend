import { IAccountRepository } from '../../domain/ports/IAccountRepository';
import { AccountResponseDto } from '../dto/accounting.dto';
import { AccountingMapper } from '../mappers/AccountingMapper';

export class ReparentAccountUseCase {
  constructor(private readonly accountRepo: IAccountRepository) {}

  async execute(
    input: { id: string; newParentId: string | null },
    context: { organizationId: string }
  ): Promise<AccountResponseDto> {
    const account = await this.accountRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!account) {
      throw new Error('Account not found');
    }

    if (input.newParentId) {
      if (input.newParentId === account.id) {
        throw new Error('An account cannot reference itself as its parent');
      }

      const parent = await this.accountRepo.findById({
        id: input.newParentId,
        organizationId: context.organizationId,
      });

      if (!parent) {
        throw new Error('New parent account not found');
      }
    }

    account.reparent(input.newParentId);
    await this.accountRepo.save(account);

    return AccountingMapper.toAccountDto(account);
  }
}
