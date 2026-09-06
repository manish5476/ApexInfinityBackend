import { IDepartmentRepository } from '../../domain/ports/IDepartmentRepository';
import { IEmployeeRepository } from '../../domain/ports/IEmployeeRepository';
import { Department } from '../../domain/entities/Department';
import { DepartmentMapper, DepartmentResponseDto } from '../mappers/DepartmentMapper';
import { EmployeeMapper } from '../mappers/EmployeeMapper';
import { NotFoundError, ValidationError } from '../../../../shared/errors';

export class DepartmentUseCases {
  constructor(
    private readonly departmentRepo: IDepartmentRepository,
    private readonly departmentMapper: DepartmentMapper,
    private readonly employeeRepo?: IEmployeeRepository,
    private readonly employeeMapper?: EmployeeMapper
  ) {}

  public async getById(organizationId: string, id: string): Promise<DepartmentResponseDto> {
    const dept = await this.departmentRepo.findById({ id, organizationId });
    if (!dept) throw new NotFoundError('Department', id);
    return this.departmentMapper.toDto(dept);
  }

  public async update(
    organizationId: string,
    id: string,
    params: { name?: string; code?: string; description?: string; parentId?: string; managerId?: string }
  ): Promise<DepartmentResponseDto> {
    const dept = await this.departmentRepo.findById({ id, organizationId });
    if (!dept) throw new NotFoundError('Department', id);

    dept.updateDetails(params);
    await this.departmentRepo.save(dept);
    return this.departmentMapper.toDto(dept);
  }

  public async delete(organizationId: string, id: string): Promise<void> {
    const dept = await this.departmentRepo.findById({ id, organizationId });
    if (!dept) throw new NotFoundError('Department', id);

    const children = await this.departmentRepo.findByParentId(organizationId, id);
    if (children.length > 0) {
      throw new ValidationError('Cannot delete department that has child sub-departments.');
    }

    await this.departmentRepo.delete({ id, organizationId });
  }

  public async getHierarchy(organizationId: string): Promise<any[]> {
    const all = await this.departmentRepo.findAll(organizationId, { isActive: true });
    const map = new Map<string, any>();
    all.forEach((d) => map.set(d.id, { ...this.departmentMapper.toDto(d), children: [] }));

    const roots: any[] = [];
    all.forEach((d) => {
      const current = map.get(d.id);
      if (d.parentId && map.has(d.parentId)) {
        map.get(d.parentId).children.push(current);
      } else {
        roots.push(current);
      }
    });

    return roots;
  }

  public async getStats(organizationId: string): Promise<{ totalDepartments: number; activeDepartments: number; totalEmployees: number }> {
    const all = await this.departmentRepo.findAll(organizationId);
    const employees = this.employeeRepo ? await this.employeeRepo.findAll(organizationId) : [];
    return {
      totalDepartments: all.length,
      activeDepartments: all.filter((d) => d.isActive).length,
      totalEmployees: employees.length,
    };
  }

  public async bulkCreate(
    organizationId: string,
    departments: Array<{ name: string; code: string; description?: string; parentId?: string; managerId?: string }>
  ): Promise<DepartmentResponseDto[]> {
    const created: DepartmentResponseDto[] = [];
    for (const d of departments) {
      const dept = Department.create({
        organizationId,
        name: d.name,
        code: d.code,
        description: d.description,
        parentId: d.parentId,
        managerId: d.managerId,
      });
      await this.departmentRepo.save(dept);
      created.push(this.departmentMapper.toDto(dept));
    }
    return created;
  }

  public async getEmployees(organizationId: string, departmentId: string): Promise<any[]> {
    if (!this.employeeRepo || !this.employeeMapper) return [];
    const employees = await this.employeeRepo.findAll(organizationId, { departmentId });
    return employees.map((e) => this.employeeMapper!.toDto(e));
  }
}
