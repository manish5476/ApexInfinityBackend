import { UpdateOrganizationUseCase } from '../../../src/modules/organization/application/use-cases/UpdateOrganizationUseCase';
import { GetMyOrganizationUseCase } from '../../../src/modules/organization/application/use-cases/GetMyOrganizationUseCase';
import { InMemoryOrganizationRepository } from '../../../src/modules/organization/infrastructure/repositories/InMemoryOrganizationRepository';
import { Organization } from '../../../src/modules/organization/domain/entities/Organization';

describe('Organization Profile Use Cases', () => {
  let orgRepo: InMemoryOrganizationRepository;
  let updateUseCase: UpdateOrganizationUseCase;
  let getMyOrgUseCase: GetMyOrganizationUseCase;

  beforeEach(() => {
    orgRepo = new InMemoryOrganizationRepository();
    updateUseCase = new UpdateOrganizationUseCase(orgRepo);
    getMyOrgUseCase = new GetMyOrganizationUseCase(orgRepo);
  });

  it('should update organization profile, GST, logo, and settings', async () => {
    const org = Organization.create('Acme Retail', 'acme-retail');
    await orgRepo.save(org);

    const result = await updateUseCase.execute({
      organizationId: org.id,
      name: 'Acme Superstores',
      primaryEmail: 'info@acme.com',
      gstNumber: '27AABCU9603R1ZM',
      uniqueShopId: 'acme-shop',
      settings: { currency: 'INR', timezone: 'Asia/Kolkata' },
    });

    expect(result.isSuccess).toBe(true);
    const updated = result.getValue();
    expect(updated.name).toBe('Acme Superstores');
    expect(updated.primaryEmail).toBe('info@acme.com');
    expect(updated.gstNumber).toBe('27AABCU9603R1ZM');
    expect(updated.uniqueShopId).toBe('acme-shop');
    expect(updated.settings?.currency).toBe('INR');
  });

  it('should retrieve my organization for active session', async () => {
    const org = Organization.create('Test Corp', 'test-corp');
    await orgRepo.save(org);

    const result = await getMyOrgUseCase.execute({ organizationId: org.id });
    expect(result.isSuccess).toBe(true);
    expect(result.getValue().id).toBe(org.id);
  });
});
