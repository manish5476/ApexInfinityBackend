import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { OpportunityStage } from '../value-objects/OpportunityStage';
import { Money } from '../value-objects/Money';
import { OpportunityWonEvent } from '../events/OpportunityWonEvent';

export interface OpportunityProps {
  organizationId: string;
  customerId: string;
  name: string;
  stage: OpportunityStage;
  amount: Money;
  ownerId: string | null;
  expectedCloseDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Opportunity extends AggregateRoot<string> {
  private _organizationId: string;
  private _customerId: string;
  private _name: string;
  private _stage: OpportunityStage;
  private _amount: Money;
  private _ownerId: string | null;
  private _expectedCloseDate: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: OpportunityProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._customerId = props.customerId;
    this._name = props.name;
    this._stage = props.stage;
    this._amount = props.amount;
    this._ownerId = props.ownerId;
    this._expectedCloseDate = props.expectedCloseDate;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get organizationId(): string { return this._organizationId; }
  get customerId(): string { return this._customerId; }
  get name(): string { return this._name; }
  get stage(): OpportunityStage { return this._stage; }
  get amount(): Money { return this._amount; }
  get ownerId(): string | null { return this._ownerId; }
  get expectedCloseDate(): Date | null { return this._expectedCloseDate; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  public get props(): OpportunityProps {
    return {
      organizationId: this._organizationId,
      customerId: this._customerId,
      name: this._name,
      stage: this._stage,
      amount: this._amount,
      ownerId: this._ownerId,
      expectedCloseDate: this._expectedCloseDate,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public updateStage(stage: OpportunityStage): void {
    this._stage = stage;
    this._updatedAt = new Date();

    if (stage === OpportunityStage.CLOSED_WON) {
      this.addDomainEvent(new OpportunityWonEvent(this.id, this.organizationId, this._amount.amount));
    }
  }

  public static create(
    params: Omit<OpportunityProps, 'createdAt' | 'updatedAt'> & { id: string }
  ): Opportunity {
    return new Opportunity(params.id, {
      ...params,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static reconstitute(params: OpportunityProps & { id: string }): Opportunity {
    return new Opportunity(params.id, params);
  }
}
