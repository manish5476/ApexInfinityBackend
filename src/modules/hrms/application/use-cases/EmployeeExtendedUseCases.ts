import { IEmployeeRepository } from '../../domain/ports/IEmployeeRepository';
import { IAttendanceDailyRepository } from '../../domain/ports/IAttendanceDailyRepository';
import { ILeaveBalanceRepository } from '../../domain/ports/ILeaveBalanceRepository';
import { ICompanyAssetRepository } from '../../domain/ports/ICompanyAssetRepository';
import { IEmployeeDocumentRepository } from '../../domain/ports/IEmployeeDocumentRepository';
import { IAttendanceLogRepository } from '../../domain/ports/IAttendanceLogRepository';
import { EmployeeMapper, EmployeeResponseDto } from '../mappers/EmployeeMapper';
import { NotFoundError } from '../../../../shared/errors';

export class EmployeeExtendedUseCases {
  constructor(
    private readonly employeeRepo: IEmployeeRepository,
    private readonly employeeMapper: EmployeeMapper,
    private readonly attendanceDailyRepo?: IAttendanceDailyRepository,
    private readonly leaveBalanceRepo?: ILeaveBalanceRepository,
    private readonly assetRepo?: ICompanyAssetRepository,
    private readonly documentRepo?: IEmployeeDocumentRepository,
    private readonly attendanceLogRepo?: IAttendanceLogRepository
  ) {}

  public async getMyProfile(organizationId: string, userId: string): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepo.findByUserId(organizationId, userId);
    if (!employee) throw new NotFoundError('Employee profile for user', userId);
    return this.employeeMapper.toDto(employee);
  }

  public async getByUserId(organizationId: string, userId: string): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepo.findByUserId(organizationId, userId);
    if (!employee) throw new NotFoundError('Employee for user', userId);
    return this.employeeMapper.toDto(employee);
  }

  public async deactivate(
    organizationId: string,
    id: string,
    params?: { dateOfExit?: Date; exitReason?: string }
  ): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepo.findById({ id, organizationId });
    if (!employee) throw new NotFoundError('Employee', id);

    employee.updateEmployment({
      status: 'terminated',
      exitDate: params?.dateOfExit ?? new Date(),
    });

    await this.employeeRepo.save(employee);
    return this.employeeMapper.toDto(employee);
  }

  public async inviteUser(
    organizationId: string,
    id: string,
    _params: { email: string; name: string; roleId?: string }
  ): Promise<{ message: string; employeeId: string }> {
    const employee = await this.employeeRepo.findById({ id, organizationId });
    if (!employee) throw new NotFoundError('Employee', id);

    return {
      message: 'Invitation sent successfully',
      employeeId: employee.id,
    };
  }

  public async getWorkspace360(organizationId: string, id: string): Promise<any> {
    const employee = await this.employeeRepo.findById({ id, organizationId });
    if (!employee) throw new NotFoundError('Employee', id);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayAttendance = this.attendanceDailyRepo
      ? await this.attendanceDailyRepo.findByEmployeeAndDate(organizationId, employee.id, todayStart)
      : null;

    const leaveBalances = this.leaveBalanceRepo && employee.userId
      ? await this.leaveBalanceRepo.findAll(organizationId)
      : [];

    const assignedAssets = this.assetRepo
      ? await this.assetRepo.findByEmployeeRef(organizationId, employee.id)
      : [];

    const documents = this.documentRepo
      ? await this.documentRepo.findByEmployeeRef(organizationId, employee.id)
      : [];

    const recentPunches = this.attendanceLogRepo && employee.userId
      ? await this.attendanceLogRepo.findByUser(organizationId, employee.userId)
      : [];

    return {
      employee: this.employeeMapper.toDto(employee),
      todayAttendance: todayAttendance ? {
        id: todayAttendance.id,
        status: todayAttendance.status,
        firstIn: todayAttendance.firstIn,
        lastOut: todayAttendance.lastOut,
        totalWorkHours: todayAttendance.totalWorkHours,
      } : null,
      leaveBalances,
      assignedAssets: assignedAssets.map((a) => ({
        id: a.id,
        assetCode: a.assetCode,
        name: a.name,
        category: a.category,
        status: a.status,
        condition: a.condition,
      })),
      documents: documents.map((d) => ({
        id: d.id,
        title: d.title,
        documentType: d.documentType,
        status: d.status,
        fileUrl: d.fileUrl,
      })),
      recentPunches: recentPunches.slice(0, 10),
      isConfidentialViewer: true,
    };
  }
}
