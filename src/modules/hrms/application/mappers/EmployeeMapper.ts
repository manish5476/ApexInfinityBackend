import { IMapper } from '../../../../core/application/IMapper';
import { Employee, EmployeeProps } from '../../domain/entities/Employee';
import { EmployeeCode } from '../../domain/value-objects/EmployeeCode';
import { EmailAddress } from '../../../../shared/value-objects/EmailAddress';
import { EmployeeResponseDto } from '../dto/EmployeeDto';
export { EmployeeResponseDto };

export class EmployeeMapper implements IMapper<Employee, any, EmployeeResponseDto> {
  public toDomain(raw: any): Employee {
    const props: EmployeeProps = {
      organizationId: raw.organizationId,
      employeeCode: EmployeeCode.create(raw.employeeCode),
      userId: raw.userId || undefined,
      personal: {
        firstName: raw.firstName,
        lastName: raw.lastName,
        email: EmailAddress.create(raw.email),
        phone: raw.phone || undefined,
        dateOfBirth: raw.dateOfBirth ? new Date(raw.dateOfBirth) : undefined,
        gender: raw.gender || undefined,
      },
      employment: {
        departmentId: raw.departmentId || undefined,
        designationId: raw.designationId || undefined,
        reportingManagerId: raw.reportingManagerId || undefined,
        joiningDate: new Date(raw.joiningDate),
        workMode: raw.workMode,
        employmentType: raw.employmentType,
        status: raw.status,
        exitDate: raw.exitDate ? new Date(raw.exitDate) : undefined,
      },
      attendanceConfig: {
        shiftId: raw.shiftId || undefined,
        allowWebPunch: raw.allowWebPunch ?? true,
        biometricId: raw.biometricId || undefined,
      },
      bankDetails: raw.bankDetails
        ? {
            panNumber: raw.bankDetails.panNumber || undefined,
            uanNumber: raw.bankDetails.uanNumber || undefined,
            bankAccountNumber: raw.bankDetails.bankAccountNumber || undefined,
            bankIfsc: raw.bankDetails.bankIfsc || undefined,
            bankName: raw.bankDetails.bankName || undefined,
          }
        : undefined,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
    };

    return Employee.reconstitute(raw._id || raw.id, props);
  }

  public toPersistence(domain: Employee): Record<string, unknown> {
    return {
      _id: domain.id,
      organizationId: domain.organizationId,
      employeeCode: domain.employeeCode.value,
      userId: domain.userId,
      firstName: domain.personal.firstName,
      lastName: domain.personal.lastName,
      email: domain.personal.email.value,
      phone: domain.personal.phone,
      dateOfBirth: domain.personal.dateOfBirth,
      gender: domain.personal.gender,
      departmentId: domain.employment.departmentId,
      designationId: domain.employment.designationId,
      reportingManagerId: domain.employment.reportingManagerId,
      joiningDate: domain.employment.joiningDate,
      workMode: domain.employment.workMode,
      employmentType: domain.employment.employmentType,
      status: domain.employment.status,
      exitDate: domain.employment.exitDate,
      shiftId: domain.attendanceConfig.shiftId,
      allowWebPunch: domain.attendanceConfig.allowWebPunch,
      biometricId: domain.attendanceConfig.biometricId,
      bankDetails: domain.bankDetails,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  public toDto(domain: Employee): EmployeeResponseDto {
    return {
      id: domain.id,
      organizationId: domain.organizationId,
      employeeCode: domain.employeeCode.value,
      userId: domain.userId,
      fullName: domain.fullName,
      personal: {
        firstName: domain.personal.firstName,
        lastName: domain.personal.lastName,
        email: domain.personal.email.value,
        phone: domain.personal.phone,
        dateOfBirth: domain.personal.dateOfBirth?.toISOString(),
        gender: domain.personal.gender,
      },
      employment: {
        departmentId: domain.employment.departmentId,
        designationId: domain.employment.designationId,
        reportingManagerId: domain.employment.reportingManagerId,
        joiningDate: domain.employment.joiningDate.toISOString(),
        workMode: domain.employment.workMode,
        employmentType: domain.employment.employmentType,
        status: domain.employment.status,
        exitDate: domain.employment.exitDate?.toISOString(),
      },
      attendanceConfig: {
        shiftId: domain.attendanceConfig.shiftId,
        allowWebPunch: domain.attendanceConfig.allowWebPunch,
        biometricId: domain.attendanceConfig.biometricId,
      },
      bankDetails: domain.bankDetails,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}
