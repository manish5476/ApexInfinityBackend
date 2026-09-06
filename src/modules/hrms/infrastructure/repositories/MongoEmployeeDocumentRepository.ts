import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { IEmployeeDocumentRepository } from '../../domain/ports/IEmployeeDocumentRepository';
import { EmployeeDocument } from '../../domain/entities/EmployeeDocument';
import { EmployeeDocumentDocument } from '../persistence/employee-document.model';
import { EmployeeDocumentMapper } from '../../application/mappers/EmployeeDocumentMapper';

export class MongoEmployeeDocumentRepository
  extends MongoBaseRepository<EmployeeDocument, EmployeeDocumentDocument>
  implements IEmployeeDocumentRepository
{
  constructor(model: Model<EmployeeDocumentDocument>, mapper: EmployeeDocumentMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'title', 'documentType', 'status']);
  }

  public async findByUser(organizationId: string, userId: string): Promise<EmployeeDocument[]> {
    const docs = await this.model.find({ organizationId, userId }).sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async findByEmployeeRef(organizationId: string, employeeRef: string): Promise<EmployeeDocument[]> {
    const docs = await this.model.find({ organizationId, employeeRef }).sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async findAll(organizationId: string, filter?: { userId?: string; employeeRef?: string; documentType?: string; status?: string }): Promise<EmployeeDocument[]> {
    const query: any = { organizationId };
    if (filter?.userId) query.userId = filter.userId;
    if (filter?.employeeRef) query.employeeRef = filter.employeeRef;
    if (filter?.documentType) query.documentType = filter.documentType;
    if (filter?.status) query.status = filter.status;
    const docs = await this.model.find(query).sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }
}
