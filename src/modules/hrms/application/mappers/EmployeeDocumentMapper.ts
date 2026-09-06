import { IMapper } from '../../../../core/application/IMapper';
import { EmployeeDocument, EmployeeDocumentProps } from '../../domain/entities/EmployeeDocument';

export class EmployeeDocumentMapper implements IMapper<EmployeeDocument, any, any> {
  public toDomain(raw: any): EmployeeDocument {
    const props: EmployeeDocumentProps = {
      organizationId: raw.organizationId,
      branchId: raw.branchId || undefined,
      userId: raw.userId || undefined,
      employeeRef: raw.employeeRef || undefined,
      documentType: raw.documentType,
      documentNumber: raw.documentNumber || undefined,
      title: raw.title,
      fileUrl: raw.fileUrl,
      fileName: raw.fileName || undefined,
      fileSize: raw.fileSize,
      mimeType: raw.mimeType || undefined,
      status: raw.status || 'pending',
      expiryDate: raw.expiryDate ? new Date(raw.expiryDate) : undefined,
      verifiedBy: raw.verifiedBy || undefined,
      verifiedAt: raw.verifiedAt ? new Date(raw.verifiedAt) : undefined,
      verificationNotes: raw.verificationNotes || undefined,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };
    return EmployeeDocument.reconstitute(raw._id || raw.id, props);
  }

  public toPersistence(domain: EmployeeDocument): Record<string, unknown> {
    return {
      _id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      userId: domain.userId,
      employeeRef: domain.employeeRef,
      documentType: domain.documentType,
      documentNumber: domain.documentNumber,
      title: domain.title,
      fileUrl: domain.fileUrl,
      fileName: domain.fileName,
      fileSize: domain.fileSize,
      mimeType: domain.mimeType,
      status: domain.status,
      expiryDate: domain.expiryDate,
      verifiedBy: domain.verifiedBy,
      verifiedAt: domain.verifiedAt,
      verificationNotes: domain.verificationNotes,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public toDto(domain: EmployeeDocument): any {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      branchId: domain.branchId,
      userId: domain.userId,
      employeeRef: domain.employeeRef,
      documentType: domain.documentType,
      documentNumber: domain.documentNumber,
      title: domain.title,
      fileUrl: domain.fileUrl,
      fileName: domain.fileName,
      fileSize: domain.fileSize,
      mimeType: domain.mimeType,
      status: domain.status,
      expiryDate: domain.expiryDate?.toISOString(),
      verifiedBy: domain.verifiedBy,
      verifiedAt: domain.verifiedAt?.toISOString(),
      verificationNotes: domain.verificationNotes,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}
