import { IWebhookRepository } from '../../domain/ports/IWebhookRepository';
import { NotFoundError } from '../../../../shared/errors';

export class DeleteWebhookUseCase {
  constructor(private readonly repo: IWebhookRepository) {}

  async execute(params: { id: string; organizationId: string }): Promise<void> {
    const deleted = await this.repo.delete(params);
    if (!deleted) throw new NotFoundError('WebhookSubscription', params.id);
  }
}
