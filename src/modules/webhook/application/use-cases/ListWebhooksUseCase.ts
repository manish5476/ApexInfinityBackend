import { IWebhookRepository } from '../../domain/ports/IWebhookRepository';
import { WebhookSubscription } from '../../domain/entities/WebhookSubscription';

export interface ListWebhooksDto {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export class ListWebhooksUseCase {
  constructor(private readonly webhookRepo: IWebhookRepository) {}

  async execute(dto: ListWebhooksDto, context: { organizationId: string }): Promise<{ data: WebhookSubscription[]; total: number }> {
    return this.webhookRepo.list({
      organizationId: context.organizationId,
      page: dto.page ?? 1,
      limit: dto.limit ?? 20,
      isActive: dto.isActive,
    });
  }
}
