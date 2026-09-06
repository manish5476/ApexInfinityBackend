import { AttendanceStatus } from '../../domain/value-objects/HrmsEnums';

export interface RecordPunchDto {
  employeeId: string;
  type: 'in' | 'out';
  timestamp?: string; // ISO string, defaults to now
  deviceId?: string;
  source?: string;
}

export interface AttendanceDailyResponseDto {
  id: string;
  organizationId: string;
  employeeId: string;
  date: string;
  shiftId?: string;
  firstIn?: string;
  lastOut?: string;
  totalWorkHours: number;
  isLate: boolean;
  lateMinutes: number;
  status: AttendanceStatus;
  punches: {
    type: 'in' | 'out';
    timestamp: string;
    deviceId?: string;
    source?: string;
  }[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
