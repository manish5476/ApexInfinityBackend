import { IAccountRepository } from '../../domain/ports/IAccountRepository';
import { Account } from '../../domain/entities/Account';
import { CreateAccountDto, AccountResponseDto } from '../dto/accounting.dto';
import { AccountingMapper } from '../mappers/AccountingMapper';
import { randomUUID } from 'crypto';

export class CreateAccountUseCase {
  constructor(private readonly accountRepo: IAccountRepository) {}

  async execute(
    dto: CreateAccountDto,
    context: { organizationId: string }
  ): Promise<AccountResponseDto> {
    const existing = await this.accountRepo.findByCode({
      code: dto.code.trim().toUpperCase(),
      organizationId: context.organizationId,
    });

    if (existing) {
      throw new Error(`Account code '${dto.code}' already exists`);
    }

    if (dto.parent) {
      const parent = await this.accountRepo.findById({
        id: dto.parent,
        organizationId: context.organizationId,
      });
      if (!parent) {
        throw new Error(`Parent account '${dto.parent}' not found`);
      }
    }

    const account = Account.create({
      id: randomUUID(),
      organizationId: context.organizationId,
      code: dto.code,
      name: dto.name,
      type: dto.type,
      parent: dto.parent,
      isGroup: dto.isGroup,
      metadata: dto.metadata,
    });

    await this.accountRepo.save(account);

    return AccountingMapper.toAccountDto(account);
  }
}
