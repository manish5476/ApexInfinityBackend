import { Lead } from '../../../../src/modules/crm/domain/entities/Lead';
import { LeadStatus } from '../../../../src/modules/crm/domain/value-objects/LeadStatus';
import { LeadConvertedEvent } from '../../../../src/modules/crm/domain/events/LeadConvertedEvent';

describe('Lead Entity', () => {
  const baseParams = {
    id: 'lead-uuid-1',
    organizationId: 'org-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    companyName: 'Doe Industries',
    ownerId: null,
  };

  it('should create a lead with NEW status', () => {
    const lead = Lead.create(baseParams);

    expect(lead.id).toBe(baseParams.id);
    expect(lead.firstName).toBe('John');
    expect(lead.lastName).toBe('Doe');
    expect(lead.email).toBe('john.doe@example.com');
    expect(lead.status).toBe(LeadStatus.NEW);
  });

  it('should convert lead to QUALIFIED status and emit LeadConvertedEvent', () => {
    const lead = Lead.create(baseParams);
    lead.convert('customer-uuid-1');

    expect(lead.status).toBe(LeadStatus.QUALIFIED);
    expect(lead.domainEvents).toHaveLength(1);
    expect(lead.domainEvents[0]).toBeInstanceOf(LeadConvertedEvent);
    expect((lead.domainEvents[0] as LeadConvertedEvent).payload.leadId).toBe(baseParams.id);
    expect((lead.domainEvents[0] as LeadConvertedEvent).payload.customerId).toBe('customer-uuid-1');
  });

  it('should throw if converting an already-converted lead', () => {
    const lead = Lead.create(baseParams);
    lead.convert();
    expect(() => lead.convert()).toThrow('Lead is already converted');
  });
});
