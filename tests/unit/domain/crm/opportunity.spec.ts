import { Opportunity } from '../../../../src/modules/crm/domain/entities/Opportunity';
import { OpportunityStage } from '../../../../src/modules/crm/domain/value-objects/OpportunityStage';
import { Money } from '../../../../src/modules/crm/domain/value-objects/Money';
import { OpportunityWonEvent } from '../../../../src/modules/crm/domain/events/OpportunityWonEvent';

describe('Opportunity Entity', () => {
  const baseParams = {
    id: 'opp-1',
    organizationId: 'org-1',
    customerId: 'cust-1',
    name: 'Enterprise License Deal',
    stage: OpportunityStage.PROSPECTING,
    amount: new Money(150000, 'INR'),
    ownerId: 'rep-1',
    expectedCloseDate: new Date('2026-12-31'),
  };

  it('should create an opportunity with initial props', () => {
    const opp = Opportunity.create(baseParams);

    expect(opp.id).toBe('opp-1');
    expect(opp.customerId).toBe('cust-1');
    expect(opp.name).toBe('Enterprise License Deal');
    expect(opp.stage).toBe(OpportunityStage.PROSPECTING);
    expect(opp.amount.amount).toBe(150000);
    expect(opp.amount.currency).toBe('INR');
    expect(opp.ownerId).toBe('rep-1');
    expect(opp.domainEvents).toHaveLength(0);
  });

  it('should transition stage to proposal and negotiation without events', () => {
    const opp = Opportunity.create(baseParams);
    opp.updateStage(OpportunityStage.PROPOSAL);
    expect(opp.stage).toBe(OpportunityStage.PROPOSAL);
    expect(opp.domainEvents).toHaveLength(0);

    opp.updateStage(OpportunityStage.NEGOTIATION);
    expect(opp.stage).toBe(OpportunityStage.NEGOTIATION);
    expect(opp.domainEvents).toHaveLength(0);
  });

  it('should raise OpportunityWonEvent when transitioning to CLOSED_WON', () => {
    const opp = Opportunity.create(baseParams);
    opp.updateStage(OpportunityStage.CLOSED_WON);

    expect(opp.stage).toBe(OpportunityStage.CLOSED_WON);
    expect(opp.domainEvents).toHaveLength(1);
    expect(opp.domainEvents[0]).toBeInstanceOf(OpportunityWonEvent);
    expect((opp.domainEvents[0] as OpportunityWonEvent).payload.amount).toBe(150000);
  });
});
