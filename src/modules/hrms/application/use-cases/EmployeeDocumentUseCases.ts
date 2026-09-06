import { IEmployeeDocumentRepository } from '../../domain/ports/IEmployeeDocumentRepository';
import { EmployeeDocument } from '../../domain/entities/EmployeeDocument';
import { EmployeeDocumentMapper } from '../mappers/EmployeeDocumentMapper';
import { DocumentType } from '../../domain/value-objects/HrmsEnums';
import { NotFoundError } from '../../../../shared/errors';

export class EmployeeDocumentUseCases {
  constructor(
    private readonly documentRepo: IEmployeeDocumentRepository,
    private readonly documentMapper: EmployeeDocumentMapper
  ) {}

  public async create(
    organizationId: string,
    params: {
      userId?: string;
      employeeRef?: string;
      branchId?: string;
      documentType: DocumentType;
      documentNumber?: string;
      title: string;
      fileUrl: string;
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
      expiryDate?: Date;
    }
  ): Promise<any> {
    const doc = EmployeeDocument.create({
      organizationId,
      ...params,
    });

    await this.documentRepo.save(doc);
    return this.documentMapper.toDto(doc);
  }

  public async list(organizationId: string, filter?: { userId?: string; employeeRef?: string; documentType?: string; status?: string }): Promise<any[]> {
    const docs = await this.documentRepo.findAll(organizationId, filter);
    return docs.map((d) => this.documentMapper.toDto(d));
  }

  public async getById(organizationId: string, id: string): Promise<any> {
    const doc = await this.documentRepo.findById({ id, organizationId });
    if (!doc) throw new NotFoundError('Document', id);
    return this.documentMapper.toDto(doc);
  }

  public async verify(
    organizationId: string,
    id: string,
    params: { verifiedBy: string; notes?: string; status?: 'verified' | 'rejected' }
  ): Promise<any> {
    const doc = await this.documentRepo.findById({ id, organizationId });
    if (!doc) throw new NotFoundError('Document', id);

    if (params.status === 'rejected') {
      doc.reject(params.verifiedBy, params.notes);
    } else {
      doc.verify(params.verifiedBy, params.notes);
    }

    await this.documentRepo.save(doc);
    return this.documentMapper.toDto(doc);
  }

  public async delete(organizationId: string, id: string): Promise<void> {
    const doc = await this.documentRepo.findById({ id, organizationId });
    if (!doc) throw new NotFoundError('Document', id);
    await this.documentRepo.delete({ id, organizationId });
  }
}
