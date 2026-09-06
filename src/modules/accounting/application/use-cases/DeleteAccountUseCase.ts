import { IAccountRepository } from '../../domain/ports/IAccountRepository';

export class DeleteAccountUseCase {
  constructor(private readonly accountRepo: IAccountRepository) {}

  async execute(
    input: { id: string },
    context: { organizationId: string }
  ): Promise<{ message: string }> {
    const account = await this.accountRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!account) {
      throw new Error('Account not found');
    }

    const children = await this.accountRepo.findByParent({
      parentId: input.id,
      organizationId: context.organizationId,
    });

    if (children.length > 0) {
      throw new Error('Cannot delete account with child accounts. Reparent or delete children first.');
    }

    await this.accountRepo.delete({
      id: input.id,
      organizationId: context.organizationId,
    });

    return { message: 'Account deleted successfully' };
  }
}
