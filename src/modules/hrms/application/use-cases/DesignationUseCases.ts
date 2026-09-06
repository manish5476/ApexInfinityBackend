import { IDesignationRepository } from '../../domain/ports/IDesignationRepository';
import { IEmployeeRepository } from '../../domain/ports/IEmployeeRepository';
import { Designation } from '../../domain/entities/Designation';
import { DesignationMapper, DesignationResponseDto } from '../mappers/DesignationMapper';
import { EmployeeMapper } from '../mappers/EmployeeMapper';
import { NotFoundError, ConflictError } from '../../../../shared/errors';

export class DesignationUseCases {
  constructor(
    private readonly designationRepo: IDesignationRepository,
    private readonly designationMapper: DesignationMapper,
    private readonly employeeRepo?: IEmployeeRepository,
    private readonly employeeMapper?: EmployeeMapper
  ) {}

  public async create(
    organizationId: string,
    params: { title: string; code: string; departmentId?: string; level?: number }
  ): Promise<DesignationResponseDto> {
    const existing = await this.designationRepo.findByCode(organizationId, params.code);
    if (existing) throw new ConflictError(`Designation code '${params.code}' already exists.`);

    const desig = Designation.create({
      organizationId,
      title: params.title,
      code: params.code,
      departmentId: params.departmentId,
      level: params.level,
    });

    await this.designationRepo.save(desig);
    return this.designationMapper.toDto(desig);
  }

  public async list(organizationId: string, filter?: { departmentId?: string; isActive?: boolean; search?: string }): Promise<DesignationResponseDto[]> {
    const list = await this.designationRepo.findAll(organizationId, filter);
    return list.map((d) => this.designationMapper.toDto(d));
  }

  public async getById(organizationId: string, id: string): Promise<DesignationResponseDto> {
    const desig = await this.designationRepo.findById({ id, organizationId });
    if (!desig) throw new NotFoundError('Designation', id);
    return this.designationMapper.toDto(desig);
  }

  public async update(
    organizationId: string,
    id: string,
    params: { title?: string; code?: string; departmentId?: string; level?: number }
  ): Promise<DesignationResponseDto> {
    const desig = await this.designationRepo.findById({ id, organizationId });
    if (!desig) throw new NotFoundError('Designation', id);

    desig.updateDetails(params);
    await this.designationRepo.save(desig);
    return this.designationMapper.toDto(desig);
  }

  public async delete(organizationId: string, id: string): Promise<void> {
    const desig = await this.designationRepo.findById({ id, organizationId });
    if (!desig) throw new NotFoundError('Designation', id);
    await this.designationRepo.delete({ id, organizationId });
  }

  public async getHierarchy(organizationId: string): Promise<any[]> {
    const list = await this.designationRepo.findAll(organizationId, { isActive: true });
    // Group by level
    const levelsMap = new Map<number, DesignationResponseDto[]>();
    list.forEach((d) => {
      const dto = this.designationMapper.toDto(d);
      const arr = levelsMap.get(d.level) || [];
      arr.push(dto);
      levelsMap.set(d.level, arr);
    });

    return Array.from(levelsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([level, designations]) => ({ level, designations }));
  }

  public async getCareerPath(organizationId: string, id: string): Promise<any> {
    const desig = await this.designationRepo.findById({ id, organizationId });
    if (!desig) throw new NotFoundError('Designation', id);

    const all = await this.designationRepo.findAll(organizationId, {
      departmentId: desig.departmentId,
      isActive: true,
    });

    const nextLevels = all
      .filter((d) => d.level > desig.level)
      .sort((a, b) => a.level - b.level)
      .map((d) => this.designationMapper.toDto(d));

    return {
      current: this.designationMapper.toDto(desig),
      nextSteps: nextLevels,
    };
  }

  public async getSalaryBands(organizationId: string): Promise<any[]> {
    const all = await this.designationRepo.findAll(organizationId, { isActive: true });
    return all.map((d) => ({
      id: d.id,
      title: d.title,
      code: d.code,
      level: d.level,
      minSalary: d.level * 25000,
      maxSalary: d.level * 50000,
    }));
  }

  public async getPromotionEligible(organizationId: string): Promise<any[]> {
    if (!this.employeeRepo || !this.employeeMapper) return [];
    const employees = await this.employeeRepo.findAll(organizationId, { status: 'active' });
    // Any employee with active status
    return employees.map((e) => this.employeeMapper!.toDto(e));
  }

  public async bulkCreate(
    organizationId: string,
    designations: Array<{ title: string; code: string; departmentId?: string; level?: number }>
  ): Promise<DesignationResponseDto[]> {
    const created: DesignationResponseDto[] = [];
    for (const d of designations) {
      const desig = Designation.create({
        organizationId,
        title: d.title,
        code: d.code,
        departmentId: d.departmentId,
        level: d.level,
      });
      await this.designationRepo.save(desig);
      created.push(this.designationMapper.toDto(desig));
    }
    return created;
  }

  public async getEmployees(organizationId: string, designationId: string): Promise<any[]> {
    if (!this.employeeRepo || !this.employeeMapper) return [];
    const employees = await this.employeeRepo.findAll(organizationId, { designationId });
    return employees.map((e) => this.employeeMapper!.toDto(e));
  }
}
