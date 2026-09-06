export type WorkMode = 'on_site' | 'remote' | 'hybrid' | 'office' | 'field';
export type EmploymentStatus = 'active' | 'probation' | 'notice_period' | 'resigned' | 'terminated' | 'relieved' | 'inactive';
export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern' | 'permanent' | 'consultant';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'on_leave' | 'holiday' | 'weekly_off' | 'week_off' | 'work_from_home' | 'on_duty';

export type LeaveType =
  | 'casual'
  | 'sick'
  | 'earned'
  | 'compensatory'
  | 'paid'
  | 'unpaid'
  | 'marriage'
  | 'paternity'
  | 'maternity'
  | 'bereavement'
  | 'study'
  | 'sabbatical';

export type LeaveRequestStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'escalated';

export type AssetCategory =
  | 'laptop'
  | 'desktop'
  | 'mobile'
  | 'sim'
  | 'vehicle'
  | 'access_card'
  | 'key'
  | 'furniture'
  | 'tool'
  | 'tablet'
  | 'other';

export type AssetCondition =
  | 'new'
  | 'good'
  | 'fair'
  | 'damaged'
  | 'repair_needed'
  | 'disposed'
  | 'lost';

export type AssetStatus =
  | 'available'
  | 'assigned'
  | 'under_maintenance'
  | 'in_repair'
  | 'retired'
  | 'lost';

export type DocumentType =
  | 'aadhaar'
  | 'pan'
  | 'passport'
  | 'voter_id'
  | 'driving_license'
  | 'offer_letter'
  | 'appointment_letter'
  | 'resignation_letter'
  | 'relieving_letter'
  | 'experience_letter'
  | 'education'
  | 'payslip'
  | 'medical_record'
  | 'nda'
  | 'contract'
  | 'policy_acknowledgement'
  | 'other';

export type DocumentVerificationStatus =
  | 'not_required'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'expired';

export type MachineProviderType =
  | 'generic'
  | 'zkteco'
  | 'hikvision'
  | 'essl'
  | 'bioenable'
  | 'suprema';

export type MachineStatus = 'active' | 'inactive' | 'maintenance' | 'offline' | 'error';
export type MachineConnectionStatus = 'online' | 'offline' | 'connecting' | 'disconnected';

export type ExpenseCategory =
  | 'travel'
  | 'food'
  | 'lodging'
  | 'fuel'
  | 'phone'
  | 'office'
  | 'client'
  | 'other';

export type ExpenseStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'partially_approved'
  | 'rejected'
  | 'reimbursed'
  | 'cancelled';

export type SalaryComponentCategory = 'earning' | 'deduction' | 'benefit' | 'reimbursement';
export type CalculationType = 'fixed' | 'percentage';
export type PayFrequency = 'monthly' | 'weekly' | 'daily';
export type SalaryStructureStatus = 'draft' | 'active' | 'superseded' | 'archived';
export type PayslipStatus = 'draft' | 'approved' | 'locked' | 'paid' | 'cancelled';

