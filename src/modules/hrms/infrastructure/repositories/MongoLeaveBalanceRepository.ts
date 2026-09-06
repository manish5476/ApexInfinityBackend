import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { ILeaveBalanceRepository } from '../../domain/ports/ILeaveBalanceRepository';
import { LeaveBalance } from '../../domain/entities/LeaveBalance';
import { LeaveBalanceDocument } from '../persistence/leave-balance.model';
import { LeaveBalanceMapper } from '../../application/mappers/LeaveBalanceMapper';

export class MongoLeaveBalanceRepository
  extends MongoBaseRepository<LeaveBalance, LeaveBalanceDocument>
  implements ILeaveBalanceRepository
{
  constructor(model: Model<LeaveBalanceDocument>, mapper: LeaveBalanceMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'userId', 'financialYear']);
  }

  public async findByUserAndYear(organizationId: string, userId: string, financialYear: string): Promise<LeaveBalance | null> {
    const doc = await this.model.findOne({ organizationId, userId, financialYear }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findAll(organizationId: string, filter?: { financialYear?: string; branchId?: string }): Promise<LeaveBalance[]> {
    const query: any = { organizationId };
    if (filter?.financialYear) query.financialYear = filter.financialYear;
    if (filter?.branchId) query.branchId = filter.branchId;
    const docs = await this.model.find(query).sort({ userId: 1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async saveMany(balances: LeaveBalance[]): Promise<void> {
    for (const b of balances) {
      await this.save(b);
    }
  }
}
