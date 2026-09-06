import { WorkMode, EmploymentStatus, EmploymentType } from '../../domain/value-objects/HrmsEnums';
import { EmployeeBankDetails } from '../../domain/entities/Employee';

export interface CreateEmployeeDto {
  employeeCode: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  departmentId?: string;
  designationId?: string;
  reportingManagerId?: string;
  joiningDate?: string;
  workMode?: WorkMode;
  employmentType?: EmploymentType;
  shiftId?: string;
  allowWebPunch?: boolean;
  biometricId?: string;
  bankDetails?: EmployeeBankDetails;
}

export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  departmentId?: string;
  designationId?: string;
  reportingManagerId?: string;
  workMode?: WorkMode;
  employmentType?: EmploymentType;
  status?: EmploymentStatus;
  exitDate?: string;
  shiftId?: string;
  allowWebPunch?: boolean;
  biometricId?: string;
  bankDetails?: EmployeeBankDetails;
}

export interface EmployeeResponseDto {
  id: string;
  organizationId: string;
  employeeCode: string;
  userId?: string;
  fullName: string;
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
  };
  employment: {
    departmentId?: string;
    designationId?: string;
    reportingManagerId?: string;
    joiningDate: string;
    workMode: WorkMode;
    employmentType: EmploymentType;
    status: EmploymentStatus;
    exitDate?: string;
  };
  attendanceConfig: {
    shiftId?: string;
    allowWebPunch: boolean;
    biometricId?: string;
  };
  bankDetails?: EmployeeBankDetails;
  createdAt: string;
  updatedAt: string;
}
