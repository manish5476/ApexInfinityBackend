import { Employee } from '../../../src/modules/hrms/domain/entities/Employee';
import { DomainError } from '../../../src/shared/errors';

describe('Employee Domain Entity (Pure Unit Test - 0 Dependencies)', () => {
  it('should create a valid Employee aggregate root and generate EmployeeCreatedEvent', () => {
    const employee = Employee.create({
      organizationId: 'org-123',
      employeeCode: 'EMP-001',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@apexinfinity.com',
      workMode: 'hybrid',
      employmentType: 'full_time',
      status: 'active',
    });

    expect(employee.id).toBeDefined();
    expect(employee.organizationId).toBe('org-123');
    expect(employee.employeeCode.value).toBe('EMP-001');
    expect(employee.fullName).toBe('Alice Johnson');
    expect(employee.personal.email.value).toBe('alice.johnson@apexinfinity.com');
    expect(employee.employment.workMode).toBe('hybrid');
    expect(employee.status).toBe('active');

    // Domain event
    expect(employee.domainEvents.length).toBe(1);
    expect(employee.domainEvents[0]!.eventName).toBe('hrms.employee.created');
  });

  it('should reject invalid employee codes', () => {
    expect(() =>
      Employee.create({
        organizationId: 'org-123',
        employeeCode: 'X', // too short
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob@apexinfinity.com',
      })
    ).toThrow(DomainError);

    expect(() =>
      Employee.create({
        organizationId: 'org-123',
        employeeCode: 'INVALID CODE!', // invalid characters
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob@apexinfinity.com',
      })
    ).toThrow(DomainError);
  });

  it('should reject empty first name or last name', () => {
    expect(() =>
      Employee.create({
        organizationId: 'org-123',
        employeeCode: 'EMP-002',
        firstName: '',
        lastName: 'Smith',
        email: 'bob@apexinfinity.com',
      })
    ).toThrow(DomainError);
  });

  it('should support linking and unlinking platform user identity', () => {
    const employee = Employee.create({
      organizationId: 'org-123',
      employeeCode: 'EMP-003',
      firstName: 'Charlie',
      lastName: 'Brown',
      email: 'charlie@apexinfinity.com',
    });

    expect(employee.userId).toBeUndefined();

    employee.linkUser('usr-999');
    expect(employee.userId).toBe('usr-999');

    employee.unlinkUser();
    expect(employee.userId).toBeUndefined();
  });

  it('should update employment details and status', () => {
    const employee = Employee.create({
      organizationId: 'org-123',
      employeeCode: 'EMP-004',
      firstName: 'Diana',
      lastName: 'Prince',
      email: 'diana@apexinfinity.com',
      status: 'probation',
    });

    expect(employee.status).toBe('probation');

    employee.updateEmployment({
      status: 'active',
      workMode: 'remote',
    });

    expect(employee.status).toBe('active');
    expect(employee.employment.workMode).toBe('remote');
  });
});
