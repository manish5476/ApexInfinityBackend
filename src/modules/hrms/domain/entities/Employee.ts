import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { DomainError } from '../../../../shared/errors';
import { EmailAddress } from '../../../../shared/value-objects/EmailAddress';
import { EmployeeCode } from '../value-objects/EmployeeCode';
import { WorkMode, EmploymentStatus, EmploymentType } from '../value-objects/HrmsEnums';
import { EmployeeCreatedEvent } from '../events/EmployeeCreatedEvent';
import { v4 as uuidv4 } from 'uuid';

export interface EmployeePersonalInfo {
  firstName: string;
  lastName: string;
  email: EmailAddress;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
}

export interface EmployeeEmploymentDetails {
  departmentId?: string;
  designationId?: string;
  reportingManagerId?: string;
  joiningDate: Date;
  workMode: WorkMode;
  employmentType: EmploymentType;
  status: EmploymentStatus;
  exitDate?: Date;
}

export interface EmployeeAttendanceConfig {
  shiftId?: string;
  allowWebPunch: boolean;
  biometricId?: string;
}

export interface EmployeeBankDetails {
  panNumber?: string;
  uanNumber?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
}

export interface EmployeeProps {
  organizationId: string;
  employeeCode: EmployeeCode;
  userId?: string;
  personal: EmployeePersonalInfo;
  employment: EmployeeEmploymentDetails;
  attendanceConfig: EmployeeAttendanceConfig;
  bankDetails?: EmployeeBankDetails;
  createdAt: Date;
  updatedAt: Date;
}

export class Employee extends AggregateRoot<string> {
  private _organizationId: string;
  private _employeeCode: EmployeeCode;
  private _userId?: string;
  private _personal: EmployeePersonalInfo;
  private _employment: EmployeeEmploymentDetails;
  private _attendanceConfig: EmployeeAttendanceConfig;
  private _bankDetails?: EmployeeBankDetails;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: EmployeeProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._employeeCode = props.employeeCode;
    this._userId = props.userId;
    this._personal = props.personal;
    this._employment = props.employment;
    this._attendanceConfig = props.attendanceConfig;
    this._bankDetails = props.bankDetails;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    organizationId: string;
    employeeCode: string;
    userId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
    departmentId?: string;
    designationId?: string;
    reportingManagerId?: string;
    joiningDate?: Date;
    workMode?: WorkMode;
    employmentType?: EmploymentType;
    status?: EmploymentStatus;
    shiftId?: string;
    allowWebPunch?: boolean;
    biometricId?: string;
    bankDetails?: EmployeeBankDetails;
  }): Employee {
    if (!params.organizationId) {
      throw new DomainError('Organization ID is required for employee.');
    }
    if (!params.firstName || params.firstName.trim().length === 0) {
      throw new DomainError('Employee first name cannot be empty.');
    }
    if (!params.lastName || params.lastName.trim().length === 0) {
      throw new DomainError('Employee last name cannot be empty.');
    }

    const codeVo = EmployeeCode.create(params.employeeCode);
    const emailVo = EmailAddress.create(params.email);
    const id = uuidv4();
    const now = new Date();

    const employee = new Employee(id, {
      organizationId: params.organizationId,
      employeeCode: codeVo,
      userId: params.userId,
      personal: {
        firstName: params.firstName.trim(),
        lastName: params.lastName.trim(),
        email: emailVo,
        phone: params.phone?.trim(),
        dateOfBirth: params.dateOfBirth,
        gender: params.gender,
      },
      employment: {
        departmentId: params.departmentId,
        designationId: params.designationId,
        reportingManagerId: params.reportingManagerId,
        joiningDate: params.joiningDate ?? now,
        workMode: params.workMode ?? 'on_site',
        employmentType: params.employmentType ?? 'full_time',
        status: params.status ?? 'active',
      },
      attendanceConfig: {
        shiftId: params.shiftId,
        allowWebPunch: params.allowWebPunch ?? true,
        biometricId: params.biometricId?.trim(),
      },
      bankDetails: params.bankDetails,
      createdAt: now,
      updatedAt: now,
    });

    employee.addDomainEvent(
      new EmployeeCreatedEvent(id, params.organizationId, codeVo.value, params.userId)
    );

    return employee;
  }

  public static reconstitute(id: string, props: EmployeeProps): Employee {
    return new Employee(id, props);
  }

  public get organizationId(): string {
    return this._organizationId;
  }

  public get employeeCode(): EmployeeCode {
    return this._employeeCode;
  }

  public get userId(): string | undefined {
    return this._userId;
  }

  public get personal(): Readonly<EmployeePersonalInfo> {
    return this._personal;
  }

  public get employment(): Readonly<EmployeeEmploymentDetails> {
    return this._employment;
  }

  public get attendanceConfig(): Readonly<EmployeeAttendanceConfig> {
    return this._attendanceConfig;
  }

  public get bankDetails(): Readonly<EmployeeBankDetails> | undefined {
    return this._bankDetails;
  }

  public get fullName(): string {
    return `${this._personal.firstName} ${this._personal.lastName}`.trim();
  }

  public get status(): EmploymentStatus {
    return this._employment.status;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public updatePersonal(params: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: 'male' | 'female' | 'other';
  }): void {
    if (params.firstName !== undefined) {
      if (!params.firstName.trim()) throw new DomainError('First name cannot be empty.');
      this._personal.firstName = params.firstName.trim();
    }
    if (params.lastName !== undefined) {
      if (!params.lastName.trim()) throw new DomainError('Last name cannot be empty.');
      this._personal.lastName = params.lastName.trim();
    }
    if (params.email !== undefined) {
      this._personal.email = EmailAddress.create(params.email);
    }
    if (params.phone !== undefined) {
      this._personal.phone = params.phone.trim();
    }
    if (params.dateOfBirth !== undefined) {
      this._personal.dateOfBirth = params.dateOfBirth;
    }
    if (params.gender !== undefined) {
      this._personal.gender = params.gender;
    }
    this._updatedAt = new Date();
  }

  public updateEmployment(params: {
    departmentId?: string;
    designationId?: string;
    reportingManagerId?: string;
    workMode?: WorkMode;
    employmentType?: EmploymentType;
    status?: EmploymentStatus;
    exitDate?: Date;
  }): void {
    if (params.departmentId !== undefined) this._employment.departmentId = params.departmentId || undefined;
    if (params.designationId !== undefined) this._employment.designationId = params.designationId || undefined;
    if (params.reportingManagerId !== undefined) this._employment.reportingManagerId = params.reportingManagerId || undefined;
    if (params.workMode !== undefined) this._employment.workMode = params.workMode;
    if (params.employmentType !== undefined) this._employment.employmentType = params.employmentType;
    if (params.status !== undefined) this._employment.status = params.status;
    if (params.exitDate !== undefined) this._employment.exitDate = params.exitDate;
    this._updatedAt = new Date();
  }

  public updateAttendanceConfig(params: {
    shiftId?: string;
    allowWebPunch?: boolean;
    biometricId?: string;
  }): void {
    if (params.shiftId !== undefined) this._attendanceConfig.shiftId = params.shiftId || undefined;
    if (params.allowWebPunch !== undefined) this._attendanceConfig.allowWebPunch = params.allowWebPunch;
    if (params.biometricId !== undefined) this._attendanceConfig.biometricId = params.biometricId?.trim();
    this._updatedAt = new Date();
  }

  public updateBankDetails(details: EmployeeBankDetails): void {
    this._bankDetails = { ...details };
    this._updatedAt = new Date();
  }

  public linkUser(userId: string): void {
    if (!userId) throw new DomainError('User ID is required to link user.');
    this._userId = userId;
    this._updatedAt = new Date();
  }

  public unlinkUser(): void {
    this._userId = undefined;
    this._updatedAt = new Date();
  }
}
