import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { IExpenseClaimRepository } from '../../domain/ports/IExpenseClaimRepository';
import { ExpenseClaim } from '../../domain/entities/ExpenseClaim';
import { ExpenseClaimDocument } from '../persistence/expense-claim.model';
import { ExpenseClaimMapper } from '../../application/mappers/ExpenseClaimMapper';

export class MongoExpenseClaimRepository
  extends MongoBaseRepository<ExpenseClaim, ExpenseClaimDocument>
  implements IExpenseClaimRepository
{
  constructor(model: Model<ExpenseClaimDocument>, mapper: ExpenseClaimMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'claimNumber', 'status', 'totalAmount']);
  }

  public async findByUser(organizationId: string, userId: string): Promise<ExpenseClaim[]> {
    const docs = await this.model.find({ organizationId, userId }).sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async findAll(organizationId: string, filter?: { userId?: string; status?: string; branchId?: string }): Promise<ExpenseClaim[]> {
    const query: any = { organizationId };
    if (filter?.userId) query.userId = filter.userId;
    if (filter?.status) query.status = filter.status;
    if (filter?.branchId) query.branchId = filter.branchId;
    const docs = await this.model.find(query).sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }
}
