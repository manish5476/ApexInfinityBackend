import { Model } from 'mongoose';
import { MongoBaseRepository } from '../../../../infrastructure/database/MongoBaseRepository';
import { IEmployeeRepository } from '../../domain/ports/IEmployeeRepository';
import { Employee } from '../../domain/entities/Employee';
import { EmployeeDoc } from '../persistence/employee.model';
import { EmployeeMapper } from '../../application/mappers/EmployeeMapper';

export class MongoEmployeeRepository
  extends MongoBaseRepository<Employee, EmployeeDoc>
  implements IEmployeeRepository
{
  constructor(model: Model<EmployeeDoc>, mapper: EmployeeMapper) {
    super(model, mapper, ['createdAt', 'updatedAt', 'joiningDate', 'employeeCode', 'lastName']);
  }

  public async findByCode(organizationId: string, code: string): Promise<Employee | null> {
    const doc = await this.model
      .findOne({ organizationId, employeeCode: code.toUpperCase() })
      .exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findByUserId(organizationId: string, userId: string): Promise<Employee | null> {
    const doc = await this.model.findOne({ organizationId, userId }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findByEmail(organizationId: string, email: string): Promise<Employee | null> {
    const doc = await this.model
      .findOne({ organizationId, email: email.toLowerCase() })
      .exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findAll(organizationId: string, filter?: { departmentId?: string; designationId?: string; status?: string; branchId?: string; search?: string }): Promise<Employee[]> {
    const query: any = { organizationId };
    if (filter?.departmentId) query.departmentId = filter.departmentId;
    if (filter?.designationId) query.designationId = filter.designationId;
    if (filter?.status) query.status = filter.status;
    if (filter?.branchId) query.branchId = filter.branchId;
    if (filter?.search) {
      query.$or = [
        { firstName: { $regex: filter.search, $options: 'i' } },
        { lastName: { $regex: filter.search, $options: 'i' } },
        { employeeCode: { $regex: filter.search, $options: 'i' } },
        { email: { $regex: filter.search, $options: 'i' } },
      ];
    }
    const docs = await this.model.find(query).sort({ lastName: 1, firstName: 1 }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }
}

