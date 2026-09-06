export interface CreateDepartmentDto {
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  managerId?: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  code?: string;
  description?: string;
  parentId?: string;
  managerId?: string;
}

export interface DepartmentResponseDto {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
