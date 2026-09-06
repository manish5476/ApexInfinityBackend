import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { IPayslipRepository } from '../../domain/ports/IPayslipRepository';
import { Payslip } from '../../domain/entities/Payslip';
import { PayslipDocument } from '../persistence/payslip.model';
import { PayslipMapper } from '../../application/mappers/PayslipMapper';

export class MongoPayslipRepository
  extends MongoBaseRepository<Payslip, PayslipDocument>
  implements IPayslipRepository
{
  constructor(model: Model<PayslipDocument>, mapper: PayslipMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'payslipNumber', 'month', 'year', 'status']);
  }

  public async findByUserAndPeriod(organizationId: string, userId: string, month: number, year: number): Promise<Payslip | null> {
    const doc = await this.model.findOne({ organizationId, userId, month, year }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findByUser(organizationId: string, userId: string): Promise<Payslip[]> {
    const docs = await this.model.find({ organizationId, userId }).sort({ year: -1, month: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async findAll(organizationId: string, filter?: { userId?: string; month?: number; year?: number; status?: string }): Promise<Payslip[]> {
    const query: any = { organizationId };
    if (filter?.userId) query.userId = filter.userId;
    if (filter?.month) query.month = filter.month;
    if (filter?.year) query.year = filter.year;
    if (filter?.status) query.status = filter.status;
    const docs = await this.model.find(query).sort({ year: -1, month: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async saveMany(payslips: Payslip[]): Promise<void> {
    for (const p of payslips) {
      await this.save(p);
    }
  }
}
