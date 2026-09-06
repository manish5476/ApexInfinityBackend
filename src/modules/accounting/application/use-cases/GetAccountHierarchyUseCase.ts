import { IAccountRepository, AccountHierarchyNode } from '../../domain/ports/IAccountRepository';
import { AccountResponseDto } from '../dto/accounting.dto';
import { AccountingMapper } from '../mappers/AccountingMapper';

export interface AccountHierarchyResponseNode {
  account: AccountResponseDto;
  children: AccountHierarchyResponseNode[];
}

export class GetAccountHierarchyUseCase {
  constructor(private readonly accountRepo: IAccountRepository) {}

  async execute(context: { organizationId: string }): Promise<AccountHierarchyResponseNode[]> {
    const rawTree = await this.accountRepo.getHierarchy({ organizationId: context.organizationId });

    const mapNode = (node: AccountHierarchyNode): AccountHierarchyResponseNode => ({
      account: AccountingMapper.toAccountDto(node.account),
      children: node.children.map(mapNode),
    });

    return rawTree.map(mapNode);
  }
}
