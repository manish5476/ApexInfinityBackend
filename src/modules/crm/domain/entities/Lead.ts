import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { LeadStatus } from '../value-objects/LeadStatus';
import { LeadConvertedEvent } from '../events/LeadConvertedEvent';

export interface LeadProps {
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string | null;
  status: LeadStatus;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Lead extends AggregateRoot<string> {
  private _organizationId: string;
  private _firstName: string;
  private _lastName: string;
  private _email: string;
  private _companyName: string | null;
  private _status: LeadStatus;
  private _ownerId: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: LeadProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._email = props.email;
    this._companyName = props.companyName;
    this._status = props.status;
    this._ownerId = props.ownerId;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get organizationId(): string { return this._organizationId; }
  get firstName(): string { return this._firstName; }
  get lastName(): string { return this._lastName; }
  get email(): string { return this._email; }
  get companyName(): string | null { return this._companyName; }
  get status(): LeadStatus { return this._status; }
  get ownerId(): string | null { return this._ownerId; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  public get props(): LeadProps {
    return {
      organizationId: this._organizationId,
      firstName: this._firstName,
      lastName: this._lastName,
      email: this._email,
      companyName: this._companyName,
      status: this._status,
      ownerId: this._ownerId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public convert(customerId?: string): void {
    if (this._status === LeadStatus.QUALIFIED) {
      throw new Error('Lead is already converted');
    }
    this._status = LeadStatus.QUALIFIED;
    this._updatedAt = new Date();
    
    this.addDomainEvent(new LeadConvertedEvent(this.id, this.organizationId, customerId));
  }

  public static create(
    params: Omit<LeadProps, 'status' | 'createdAt' | 'updatedAt'> & { id: string }
  ): Lead {
    return new Lead(params.id, {
      ...params,
      status: LeadStatus.NEW,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(params: LeadProps & { id: string }): Lead {
    return new Lead(params.id, params);
  }
}
