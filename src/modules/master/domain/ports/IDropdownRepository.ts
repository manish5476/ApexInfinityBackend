export interface DropdownItemDto {
  label: string;
  value: string;
  meta?: Record<string, unknown>;
  data: Record<string, unknown>;
}

export interface DropdownQueryOptions {
  organizationId: string;
  search?: string;
  searchField?: string;
  labelField?: string | string[];
  labelTemplate?: string;
  valueField?: string;
  metaFields?: string[];
  extraFilter?: Record<string, unknown>;
  allowedFilters?: string[];
  filterParams?: Record<string, unknown>;
  includeIds?: string[];
  excludeIds?: string[];
  isActive?: boolean | 'all';
  page?: number;
  limit?: number;
}

export interface DropdownResult {
  data: DropdownItemDto[];
  total?: number;
  page: number;
  totalPages?: number;
  hasMore: boolean;
}

export interface IDropdownRepository {
  getDropdown(resource: string, options: DropdownQueryOptions): Promise<DropdownResult>;
  getMasterSnapshot(organizationId: string): Promise<Record<string, unknown>>;
  getQuickStats(organizationId: string, period?: string): Promise<Record<string, unknown>>;
  getEntityDetails(organizationId: string, type: string, id: string): Promise<Record<string, unknown> | null>;
  getSpecificList(organizationId: string, type: string, query: Record<string, unknown>): Promise<Record<string, unknown>>;
}
