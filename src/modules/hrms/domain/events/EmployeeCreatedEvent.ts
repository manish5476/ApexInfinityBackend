import { IDomainEvent } from '../../../../core/domain/IDomainEvent';

export interface EmployeeCreatedPayload {
  employeeId: string;
  organizationId: string;
  employeeCode: string;
  userId?: string;
}

export class EmployeeCreatedEvent implements IDomainEvent<EmployeeCreatedPayload> {
  public readonly eventName = 'hrms.employee.created';
  public readonly occurredOn: Date;
  public readonly aggregateId: string;
  public readonly payload: EmployeeCreatedPayload;

  constructor(employeeId: string, organizationId: string, employeeCode: string, userId?: string) {
    this.occurredOn = new Date();
    this.aggregateId = employeeId;
    this.payload = { employeeId, organizationId, employeeCode, userId };
    Object.freeze(this);
  }
}
