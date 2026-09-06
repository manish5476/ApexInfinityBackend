import { Router } from 'express';
import { Connection } from 'mongoose';

// Persistence Models
import { getEmployeeModel } from './infrastructure/persistence/employee.model';
import { getDepartmentModel } from './infrastructure/persistence/department.model';
import { getDesignationModel } from './infrastructure/persistence/designation.model';
import { getCompanyAssetModel } from './infrastructure/persistence/company-asset.model';
import { getEmployeeDocumentModel } from './infrastructure/persistence/employee-document.model';
import { getShiftModel } from './infrastructure/persistence/shift.model';
import { getShiftGroupModel } from './infrastructure/persistence/shift-group.model';
import { getLeaveRequestModel } from './infrastructure/persistence/leave-request.model';
import { getLeaveBalanceModel } from './infrastructure/persistence/leave-balance.model';
import { getAttendanceDailyModel } from './infrastructure/persistence/attendance-daily.model';
import { getAttendanceLogModel } from './infrastructure/persistence/attendance-log.model';
import { getAttendanceMachineModel } from './infrastructure/persistence/attendance-machine.model';
import { getGeoFenceModel } from './infrastructure/persistence/geofence.model';
import { getHolidayModel } from './infrastructure/persistence/holiday.model';
import { getAttendanceRequestModel } from './infrastructure/persistence/attendance-request.model';
import { getSalaryStructureModel } from './infrastructure/persistence/salary-structure.model';
import { getPayslipModel } from './infrastructure/persistence/payslip.model';
import { getExpenseClaimModel } from './infrastructure/persistence/expense-claim.model';

// Application Mappers
import { EmployeeMapper } from './application/mappers/EmployeeMapper';
import { DepartmentMapper } from './application/mappers/DepartmentMapper';
import { DesignationMapper } from './application/mappers/DesignationMapper';
import { CompanyAssetMapper } from './application/mappers/CompanyAssetMapper';
import { EmployeeDocumentMapper } from './application/mappers/EmployeeDocumentMapper';
import { ShiftMapper } from './application/mappers/ShiftMapper';
import { ShiftGroupMapper } from './application/mappers/ShiftGroupMapper';
import { LeaveRequestMapper } from './application/mappers/LeaveRequestMapper';
import { LeaveBalanceMapper } from './application/mappers/LeaveBalanceMapper';
import { AttendanceMapper } from './application/mappers/AttendanceMapper';
import { AttendanceLogMapper } from './application/mappers/AttendanceLogMapper';
import { AttendanceMachineMapper } from './application/mappers/AttendanceMachineMapper';
import { GeoFenceMapper } from './application/mappers/GeoFenceMapper';
import { HolidayMapper } from './application/mappers/HolidayMapper';
import { AttendanceRequestMapper } from './application/mappers/AttendanceRequestMapper';
import { SalaryStructureMapper } from './application/mappers/SalaryStructureMapper';
import { PayslipMapper } from './application/mappers/PayslipMapper';
import { ExpenseClaimMapper } from './application/mappers/ExpenseClaimMapper';

// Mongo Repositories
import { MongoEmployeeRepository } from './infrastructure/repositories/MongoEmployeeRepository';
import { MongoDepartmentRepository } from './infrastructure/repositories/MongoDepartmentRepository';
import { MongoDesignationRepository } from './infrastructure/repositories/MongoDesignationRepository';
import { MongoCompanyAssetRepository } from './infrastructure/repositories/MongoCompanyAssetRepository';
import { MongoEmployeeDocumentRepository } from './infrastructure/repositories/MongoEmployeeDocumentRepository';
import { MongoShiftRepository } from './infrastructure/repositories/MongoShiftRepository';
import { MongoShiftGroupRepository } from './infrastructure/repositories/MongoShiftGroupRepository';
import { MongoLeaveRequestRepository } from './infrastructure/repositories/MongoLeaveRequestRepository';
import { MongoLeaveBalanceRepository } from './infrastructure/repositories/MongoLeaveBalanceRepository';
import { MongoAttendanceDailyRepository } from './infrastructure/repositories/MongoAttendanceDailyRepository';
import { MongoAttendanceLogRepository } from './infrastructure/repositories/MongoAttendanceLogRepository';
import { MongoAttendanceMachineRepository } from './infrastructure/repositories/MongoAttendanceMachineRepository';
import { MongoGeoFenceRepository } from './infrastructure/repositories/MongoGeoFenceRepository';
import { MongoHolidayRepository } from './infrastructure/repositories/MongoHolidayRepository';
import { MongoAttendanceRequestRepository } from './infrastructure/repositories/MongoAttendanceRequestRepository';
import { MongoSalaryStructureRepository } from './infrastructure/repositories/MongoSalaryStructureRepository';
import { MongoPayslipRepository } from './infrastructure/repositories/MongoPayslipRepository';
import { MongoExpenseClaimRepository } from './infrastructure/repositories/MongoExpenseClaimRepository';

// Domain Ports
import { IEmployeeRepository } from './domain/ports/IEmployeeRepository';
import { IDepartmentRepository } from './domain/ports/IDepartmentRepository';
import { IDesignationRepository } from './domain/ports/IDesignationRepository';
import { ICompanyAssetRepository } from './domain/ports/ICompanyAssetRepository';
import { IEmployeeDocumentRepository } from './domain/ports/IEmployeeDocumentRepository';
import { IShiftRepository } from './domain/ports/IShiftRepository';
import { IShiftGroupRepository } from './domain/ports/IShiftGroupRepository';
import { ILeaveRequestRepository } from './domain/ports/ILeaveRequestRepository';
import { ILeaveBalanceRepository } from './domain/ports/ILeaveBalanceRepository';
import { IAttendanceDailyRepository } from './domain/ports/IAttendanceDailyRepository';
import { IAttendanceLogRepository } from './domain/ports/IAttendanceLogRepository';
import { IAttendanceMachineRepository } from './domain/ports/IAttendanceMachineRepository';
import { IGeoFenceRepository } from './domain/ports/IGeoFenceRepository';
import { IHolidayRepository } from './domain/ports/IHolidayRepository';
import { IAttendanceRequestRepository } from './domain/ports/IAttendanceRequestRepository';
import { ISalaryStructureRepository } from './domain/ports/ISalaryStructureRepository';
import { IPayslipRepository } from './domain/ports/IPayslipRepository';
import { IExpenseClaimRepository } from './domain/ports/IExpenseClaimRepository';
import { IUserRepository } from '../auth/domain/ports/IUserRepository';

// Use Cases
import { CreateEmployeeUseCase } from './application/use-cases/CreateEmployeeUseCase';
import { GetEmployeeByIdUseCase } from './application/use-cases/GetEmployeeByIdUseCase';
import { ListEmployeesUseCase } from './application/use-cases/ListEmployeesUseCase';
import { UpdateEmployeeUseCase } from './application/use-cases/UpdateEmployeeUseCase';
import { EmployeeExtendedUseCases } from './application/use-cases/EmployeeExtendedUseCases';
import { CreateDepartmentUseCase } from './application/use-cases/CreateDepartmentUseCase';
import { ListDepartmentsUseCase } from './application/use-cases/ListDepartmentsUseCase';
import { DepartmentUseCases } from './application/use-cases/DepartmentUseCases';
import { DesignationUseCases } from './application/use-cases/DesignationUseCases';
import { CompanyAssetUseCases } from './application/use-cases/CompanyAssetUseCases';
import { EmployeeDocumentUseCases } from './application/use-cases/EmployeeDocumentUseCases';
import { ShiftAndRosteringUseCases } from './application/use-cases/ShiftAndRosteringUseCases';
import { LeaveManagementUseCases } from './application/use-cases/LeaveManagementUseCases';
import { ProcessAttendancePunchUseCase } from './application/use-cases/ProcessAttendancePunchUseCase';
import { AttendanceUseCases } from './application/use-cases/AttendanceUseCases';
import { PayrollAndExpensesUseCases } from './application/use-cases/PayrollAndExpensesUseCases';

// Controllers
import { EmployeeController } from './presentation/controllers/employee.controller';
import { DepartmentController } from './presentation/controllers/department.controller';
import { DesignationController } from './presentation/controllers/designation.controller';
import { CompanyAssetController } from './presentation/controllers/company-asset.controller';
import { EmployeeDocumentController } from './presentation/controllers/employee-document.controller';
import { ShiftController } from './presentation/controllers/shift.controller';
import { ShiftGroupController } from './presentation/controllers/shift-group.controller';
import { LeaveRequestController } from './presentation/controllers/leave-request.controller';
import { LeaveBalanceController } from './presentation/controllers/leave-balance.controller';
import { AttendanceController } from './presentation/controllers/attendance.controller';
import { AttendanceLogController } from './presentation/controllers/attendance-log.controller';
import { AttendanceDailyController } from './presentation/controllers/attendance-daily.controller';
import { AttendanceMachineController } from './presentation/controllers/attendance-machine.controller';
import { GeoFenceController } from './presentation/controllers/geofence.controller';
import { HolidayController } from './presentation/controllers/holiday.controller';
import { AttendanceRequestController } from './presentation/controllers/attendance-request.controller';
import { PayrollController } from './presentation/controllers/payroll.controller';
import { SalaryStructureController } from './presentation/controllers/salary-structure.controller';
import { ExpenseClaimController } from './presentation/controllers/expense-claim.controller';

import { createHrmsRoutes, HrmsControllers } from './presentation/routes/hrms.routes';
import { ITokenService } from '../../infrastructure/security/ITokenService';
import { IEventBus } from '../../infrastructure/messaging/IEventBus';

export * from './domain';
export * from './application';
export * from './infrastructure';
export * from './presentation';

export interface HrmsModuleDependencies {
  connection: Connection;
  tokenService: ITokenService;
  userRepo?: IUserRepository;
  eventBus?: IEventBus;
  overrides?: {
    employeeRepo?: IEmployeeRepository;
    departmentRepo?: IDepartmentRepository;
    designationRepo?: IDesignationRepository;
    companyAssetRepo?: ICompanyAssetRepository;
    employeeDocumentRepo?: IEmployeeDocumentRepository;
    shiftRepo?: IShiftRepository;
    shiftGroupRepo?: IShiftGroupRepository;
    leaveRequestRepo?: ILeaveRequestRepository;
    leaveBalanceRepo?: ILeaveBalanceRepository;
    attendanceRepo?: IAttendanceDailyRepository;
    attendanceLogRepo?: IAttendanceLogRepository;
    attendanceMachineRepo?: IAttendanceMachineRepository;
    geoFenceRepo?: IGeoFenceRepository;
    holidayRepo?: IHolidayRepository;
    attendanceRequestRepo?: IAttendanceRequestRepository;
    salaryStructureRepo?: ISalaryStructureRepository;
    payslipRepo?: IPayslipRepository;
    expenseClaimRepo?: IExpenseClaimRepository;
  };
}

export interface HrmsModule {
  employeeRepo: IEmployeeRepository;
  departmentRepo: IDepartmentRepository;
  designationRepo: IDesignationRepository;
  companyAssetRepo: ICompanyAssetRepository;
  employeeDocumentRepo: IEmployeeDocumentRepository;
  shiftRepo: IShiftRepository;
  shiftGroupRepo: IShiftGroupRepository;
  leaveRequestRepo: ILeaveRequestRepository;
  leaveBalanceRepo: ILeaveBalanceRepository;
  attendanceRepo: IAttendanceDailyRepository;
  attendanceLogRepo: IAttendanceLogRepository;
  attendanceMachineRepo: IAttendanceMachineRepository;
  geoFenceRepo: IGeoFenceRepository;
  holidayRepo: IHolidayRepository;
  attendanceRequestRepo: IAttendanceRequestRepository;
  salaryStructureRepo: ISalaryStructureRepository;
  payslipRepo: IPayslipRepository;
  expenseClaimRepo: IExpenseClaimRepository;

  createEmployeeUseCase: CreateEmployeeUseCase;
  getEmployeeByIdUseCase: GetEmployeeByIdUseCase;
  listEmployeesUseCase: ListEmployeesUseCase;
  updateEmployeeUseCase: UpdateEmployeeUseCase;
  employeeExtendedUseCases: EmployeeExtendedUseCases;

  createDepartmentUseCase: CreateDepartmentUseCase;
  listDepartmentsUseCase: ListDepartmentsUseCase;
  departmentUseCases: DepartmentUseCases;

  designationUseCases: DesignationUseCases;
  companyAssetUseCases: CompanyAssetUseCases;
  employeeDocumentUseCases: EmployeeDocumentUseCases;
  shiftUseCases: ShiftAndRosteringUseCases;
  leaveUseCases: LeaveManagementUseCases;
  punchUseCase: ProcessAttendancePunchUseCase;
  attendanceUseCases: AttendanceUseCases;
  payrollUseCases: PayrollAndExpensesUseCases;

  controllers: HrmsControllers;
  routes: Router;
}

export function createHrmsModule(deps: HrmsModuleDependencies): HrmsModule {
  // 1. Mappers
  const employeeMapper = new EmployeeMapper();
  const departmentMapper = new DepartmentMapper();
  const designationMapper = new DesignationMapper();
  const companyAssetMapper = new CompanyAssetMapper();
  const employeeDocumentMapper = new EmployeeDocumentMapper();
  const shiftMapper = new ShiftMapper();
  const shiftGroupMapper = new ShiftGroupMapper();
  const leaveRequestMapper = new LeaveRequestMapper();
  const leaveBalanceMapper = new LeaveBalanceMapper();
  const attendanceMapper = new AttendanceMapper();
  const attendanceLogMapper = new AttendanceLogMapper();
  const attendanceMachineMapper = new AttendanceMachineMapper();
  const geoFenceMapper = new GeoFenceMapper();
  const holidayMapper = new HolidayMapper();
  const attendanceRequestMapper = new AttendanceRequestMapper();
  const salaryStructureMapper = new SalaryStructureMapper();
  const payslipMapper = new PayslipMapper();
  const expenseClaimMapper = new ExpenseClaimMapper();

  // 2. Repositories
  const employeeRepo: IEmployeeRepository =
    deps.overrides?.employeeRepo ??
    new MongoEmployeeRepository(getEmployeeModel(deps.connection), employeeMapper);

  const departmentRepo: IDepartmentRepository =
    deps.overrides?.departmentRepo ??
    new MongoDepartmentRepository(getDepartmentModel(deps.connection), departmentMapper);

  const designationRepo: IDesignationRepository =
    deps.overrides?.designationRepo ??
    new MongoDesignationRepository(getDesignationModel(deps.connection), designationMapper);

  const companyAssetRepo: ICompanyAssetRepository =
    deps.overrides?.companyAssetRepo ??
    new MongoCompanyAssetRepository(getCompanyAssetModel(deps.connection), companyAssetMapper);

  const employeeDocumentRepo: IEmployeeDocumentRepository =
    deps.overrides?.employeeDocumentRepo ??
    new MongoEmployeeDocumentRepository(getEmployeeDocumentModel(deps.connection), employeeDocumentMapper);

  const shiftRepo: IShiftRepository =
    deps.overrides?.shiftRepo ??
    new MongoShiftRepository(getShiftModel(deps.connection), shiftMapper);

  const shiftGroupRepo: IShiftGroupRepository =
    deps.overrides?.shiftGroupRepo ??
    new MongoShiftGroupRepository(getShiftGroupModel(deps.connection), shiftGroupMapper);

  const leaveRequestRepo: ILeaveRequestRepository =
    deps.overrides?.leaveRequestRepo ??
    new MongoLeaveRequestRepository(getLeaveRequestModel(deps.connection), leaveRequestMapper);

  const leaveBalanceRepo: ILeaveBalanceRepository =
    deps.overrides?.leaveBalanceRepo ??
    new MongoLeaveBalanceRepository(getLeaveBalanceModel(deps.connection), leaveBalanceMapper);

  const attendanceRepo: IAttendanceDailyRepository =
    deps.overrides?.attendanceRepo ??
    new MongoAttendanceDailyRepository(getAttendanceDailyModel(deps.connection), attendanceMapper);

  const attendanceLogRepo: IAttendanceLogRepository =
    deps.overrides?.attendanceLogRepo ??
    new MongoAttendanceLogRepository(getAttendanceLogModel(deps.connection), attendanceLogMapper);

  const attendanceMachineRepo: IAttendanceMachineRepository =
    deps.overrides?.attendanceMachineRepo ??
    new MongoAttendanceMachineRepository(getAttendanceMachineModel(deps.connection), attendanceMachineMapper);

  const geoFenceRepo: IGeoFenceRepository =
    deps.overrides?.geoFenceRepo ??
    new MongoGeoFenceRepository(getGeoFenceModel(deps.connection), geoFenceMapper);

  const holidayRepo: IHolidayRepository =
    deps.overrides?.holidayRepo ??
    new MongoHolidayRepository(getHolidayModel(deps.connection), holidayMapper);

  const attendanceRequestRepo: IAttendanceRequestRepository =
    deps.overrides?.attendanceRequestRepo ??
    new MongoAttendanceRequestRepository(getAttendanceRequestModel(deps.connection), attendanceRequestMapper);

  const salaryStructureRepo: ISalaryStructureRepository =
    deps.overrides?.salaryStructureRepo ??
    new MongoSalaryStructureRepository(getSalaryStructureModel(deps.connection), salaryStructureMapper);

  const payslipRepo: IPayslipRepository =
    deps.overrides?.payslipRepo ??
    new MongoPayslipRepository(getPayslipModel(deps.connection), payslipMapper);

  const expenseClaimRepo: IExpenseClaimRepository =
    deps.overrides?.expenseClaimRepo ??
    new MongoExpenseClaimRepository(getExpenseClaimModel(deps.connection), expenseClaimMapper);

  // 3. Use Cases
  const createEmployeeUseCase = new CreateEmployeeUseCase(
    employeeRepo,
    employeeMapper,
    deps.userRepo,
    deps.eventBus
  );
  const getEmployeeByIdUseCase = new GetEmployeeByIdUseCase(employeeRepo, employeeMapper);
  const listEmployeesUseCase = new ListEmployeesUseCase(employeeRepo, employeeMapper);
  const updateEmployeeUseCase = new UpdateEmployeeUseCase(employeeRepo, employeeMapper);

  const employeeExtendedUseCases = new EmployeeExtendedUseCases(
    employeeRepo,
    employeeMapper,
    attendanceRepo,
    leaveBalanceRepo,
    companyAssetRepo,
    employeeDocumentRepo,
    attendanceLogRepo
  );

  const createDepartmentUseCase = new CreateDepartmentUseCase(departmentRepo, departmentMapper);
  const listDepartmentsUseCase = new ListDepartmentsUseCase(departmentRepo, departmentMapper);
  const departmentUseCases = new DepartmentUseCases(departmentRepo, departmentMapper, employeeRepo);

  const designationUseCases = new DesignationUseCases(designationRepo, designationMapper, employeeRepo);
  const companyAssetUseCases = new CompanyAssetUseCases(companyAssetRepo, companyAssetMapper);
  const employeeDocumentUseCases = new EmployeeDocumentUseCases(employeeDocumentRepo, employeeDocumentMapper);
  const shiftUseCases = new ShiftAndRosteringUseCases(shiftRepo, shiftMapper, shiftGroupRepo, shiftGroupMapper);
  const leaveUseCases = new LeaveManagementUseCases(
    leaveRequestRepo,
    leaveRequestMapper,
    leaveBalanceRepo,
    leaveBalanceMapper
  );

  const punchUseCase = new ProcessAttendancePunchUseCase(
    employeeRepo,
    shiftRepo,
    attendanceRepo,
    attendanceMapper,
    deps.eventBus
  );

  const attendanceUseCases = new AttendanceUseCases(
    attendanceLogRepo,
    attendanceLogMapper,
    attendanceRepo,
    attendanceMapper,
    attendanceMachineRepo,
    attendanceMachineMapper,
    geoFenceRepo,
    geoFenceMapper,
    holidayRepo,
    holidayMapper,
    attendanceRequestRepo,
    attendanceRequestMapper,
    employeeRepo
  );

  const payrollUseCases = new PayrollAndExpensesUseCases(
    payslipRepo,
    payslipMapper,
    salaryStructureRepo,
    salaryStructureMapper,
    expenseClaimRepo,
    expenseClaimMapper,
    employeeRepo
  );

  // 4. Controllers
  const employeeController = new EmployeeController(
    createEmployeeUseCase,
    getEmployeeByIdUseCase,
    listEmployeesUseCase,
    updateEmployeeUseCase,
    employeeExtendedUseCases
  );

  const departmentController = new DepartmentController(
    createDepartmentUseCase,
    listDepartmentsUseCase,
    departmentUseCases
  );

  const designationController = new DesignationController(designationUseCases);
  const companyAssetController = new CompanyAssetController(companyAssetUseCases);
  const employeeDocumentController = new EmployeeDocumentController(employeeDocumentUseCases);
  const shiftController = new ShiftController(shiftUseCases);
  const shiftGroupController = new ShiftGroupController(shiftUseCases);
  const leaveRequestController = new LeaveRequestController(leaveUseCases);
  const leaveBalanceController = new LeaveBalanceController(leaveUseCases);
  const attendanceController = new AttendanceController(punchUseCase);
  const attendanceLogController = new AttendanceLogController(attendanceUseCases);
  const attendanceDailyController = new AttendanceDailyController(attendanceUseCases);
  const attendanceMachineController = new AttendanceMachineController(attendanceUseCases);
  const geofenceController = new GeoFenceController(attendanceUseCases);
  const holidayController = new HolidayController(attendanceUseCases);
  const attendanceRequestController = new AttendanceRequestController(attendanceUseCases);
  const payrollController = new PayrollController(payrollUseCases);
  const salaryStructureController = new SalaryStructureController(payrollUseCases);
  const expenseClaimController = new ExpenseClaimController(payrollUseCases);

  const controllers: HrmsControllers = {
    employeeController,
    departmentController,
    designationController,
    companyAssetController,
    employeeDocumentController,
    shiftController,
    shiftGroupController,
    leaveRequestController,
    leaveBalanceController,
    attendanceController,
    attendanceLogController,
    attendanceDailyController,
    attendanceMachineController,
    geofenceController,
    holidayController,
    attendanceRequestController,
    payrollController,
    salaryStructureController,
    expenseClaimController,
  };

  // 5. Routes
  const routes = createHrmsRoutes(controllers, deps.tokenService);

  return {
    employeeRepo,
    departmentRepo,
    designationRepo,
    companyAssetRepo,
    employeeDocumentRepo,
    shiftRepo,
    shiftGroupRepo,
    leaveRequestRepo,
    leaveBalanceRepo,
    attendanceRepo,
    attendanceLogRepo,
    attendanceMachineRepo,
    geoFenceRepo,
    holidayRepo,
    attendanceRequestRepo,
    salaryStructureRepo,
    payslipRepo,
    expenseClaimRepo,

    createEmployeeUseCase,
    getEmployeeByIdUseCase,
    listEmployeesUseCase,
    updateEmployeeUseCase,
    employeeExtendedUseCases,

    createDepartmentUseCase,
    listDepartmentsUseCase,
    departmentUseCases,

    designationUseCases,
    companyAssetUseCases,
    employeeDocumentUseCases,
    shiftUseCases,
    leaveUseCases,
    punchUseCase,
    attendanceUseCases,
    payrollUseCases,

    controllers,
    routes,
  };
}
