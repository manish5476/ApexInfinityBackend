import { Entity } from '../../../../core/domain/Entity';
import { DomainError } from '../../../../shared/errors';
import { DocumentType, DocumentVerificationStatus } from '../value-objects/HrmsEnums';
import { v4 as uuidv4 } from 'uuid';

export interface EmployeeDocumentProps {
  organizationId: string;
  branchId?: string;
  userId?: string;
  employeeRef?: string;
  documentType: DocumentType;
  documentNumber?: string;
  title: string;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  status: DocumentVerificationStatus;
  expiryDate?: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  verificationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class EmployeeDocument extends Entity<string> {
  private _organizationId: string;
  private _branchId?: string;
  private _userId?: string;
  private _employeeRef?: string;
  private _documentType: DocumentType;
  private _documentNumber?: string;
  private _title: string;
  private _fileUrl: string;
  private _fileName?: string;
  private _fileSize?: number;
  private _mimeType?: string;
  private _status: DocumentVerificationStatus;
  private _expiryDate?: Date;
  private _verifiedBy?: string;
  private _verifiedAt?: Date;
  private _verificationNotes?: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: EmployeeDocumentProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._branchId = props.branchId;
    this._userId = props.userId;
    this._employeeRef = props.employeeRef;
    this._documentType = props.documentType;
    this._documentNumber = props.documentNumber;
    this._title = props.title;
    this._fileUrl = props.fileUrl;
    this._fileName = props.fileName;
    this._fileSize = props.fileSize;
    this._mimeType = props.mimeType;
    this._status = props.status;
    this._expiryDate = props.expiryDate;
    this._verifiedBy = props.verifiedBy;
    this._verifiedAt = props.verifiedAt;
    this._verificationNotes = props.verificationNotes;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    branchId?: string;
    userId?: string;
    employeeRef?: string;
    documentType: DocumentType;
    documentNumber?: string;
    title: string;
    fileUrl: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    expiryDate?: Date;
  }): EmployeeDocument {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for document.');
    }
    if (!params.title || params.title.trim().length === 0) {
      throw new DomainError('Document title cannot be empty.');
    }
    if (!params.fileUrl || params.fileUrl.trim().length === 0) {
      throw new DomainError('File URL cannot be empty.');
    }

    const now = new Date();
    return new EmployeeDocument(uuidv4(), {
      organizationId: params.organizationId,
      branchId: params.branchId,
      userId: params.userId,
      employeeRef: params.employeeRef,
      documentType: params.documentType,
      documentNumber: params.documentNumber?.trim(),
      title: params.title.trim(),
      fileUrl: params.fileUrl.trim(),
      fileName: params.fileName?.trim(),
      fileSize: params.fileSize,
      mimeType: params.mimeType?.trim(),
      status: 'pending',
      expiryDate: params.expiryDate,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: EmployeeDocumentProps): EmployeeDocument {
    return new EmployeeDocument(id, props);
  }

  public get organizationId(): string {
    return this._organizationId;
  }

  public get branchId(): string | undefined {
    return this._branchId;
  }

  public get userId(): string | undefined {
    return this._userId;
  }

  public get employeeRef(): string | undefined {
    return this._employeeRef;
  }

  public get documentType(): DocumentType {
    return this._documentType;
  }

  public get documentNumber(): string | undefined {
    return this._documentNumber;
  }

  public get title(): string {
    return this._title;
  }

  public get fileUrl(): string {
    return this._fileUrl;
  }

  public get fileName(): string | undefined {
    return this._fileName;
  }

  public get fileSize(): number | undefined {
    return this._fileSize;
  }

  public get mimeType(): string | undefined {
    return this._mimeType;
  }

  public get status(): DocumentVerificationStatus {
    return this._status;
  }

  public get expiryDate(): Date | undefined {
    return this._expiryDate;
  }

  public get verifiedBy(): string | undefined {
    return this._verifiedBy;
  }

  public get verifiedAt(): Date | undefined {
    return this._verifiedAt;
  }

  public get verificationNotes(): string | undefined {
    return this._verificationNotes;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public verify(verifiedBy: string, notes?: string): void {
    this._status = 'verified';
    this._verifiedBy = verifiedBy;
    this._verifiedAt = new Date();
    if (notes) this._verificationNotes = notes.trim();
    this._updatedAt = new Date();
  }

  public reject(verifiedBy: string, notes?: string): void {
    this._status = 'rejected';
    this._verifiedBy = verifiedBy;
    this._verifiedAt = new Date();
    if (notes) this._verificationNotes = notes.trim();
    this._updatedAt = new Date();
  }
}
