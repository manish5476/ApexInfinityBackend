import { ILeadRepository } from '../../domain/ports/ILeadRepository';
import { Lead } from '../../domain/entities/Lead';
import { CreateLeadDto } from '../dto/crm.dto';
import { randomUUID } from 'crypto';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';

export class CreateLeadUseCase {
  constructor(
    private readonly leadRepo: ILeadRepository,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(dto: CreateLeadDto, context: { organizationId: string }): Promise<{ id: string }> {
    const lead = Lead.create({
      id: randomUUID(),
      organizationId: context.organizationId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      companyName: dto.companyName || null,
      ownerId: dto.ownerId || null,
    });

    await this.uow.runInTransaction(async () => {
      await this.leadRepo.save(lead);
    });

    return { id: lead.id };
  }
}
