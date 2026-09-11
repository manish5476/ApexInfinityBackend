import { Router } from 'express';
import { DropdownController } from '../controllers/dropdown.controller';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { createAuthMiddleware } from '../../../../middleware/auth.middleware';

export function createDropdownRoutes(controller: DropdownController, tokenService: ITokenService): Router {
  const router = Router();
  const authGuard = createAuthMiddleware(tokenService);
  router.use(authGuard);

  // 1. Organization & Auth
  router.get('/users', controller.makeDropdownHandler('users', {
    searchField: 'name',
    labelField: ['name', 'email'],
    metaFields: ['phone', 'role'],
  }));

  router.get('/branches', controller.makeDropdownHandler('branches', {
    searchField: 'name',
    labelTemplate: '{{name}} [{{branchCode}}]',
    metaFields: ['isMainBranch'],
  }));

  router.get('/roles', controller.makeDropdownHandler('roles', {
    searchField: 'name',
    labelField: 'name',
    metaFields: ['description', 'isSuperAdmin'],
  }));

  router.get('/customers', controller.makeDropdownHandler('customers', {
    searchField: 'name',
    labelField: ['name', 'phone'],
    metaFields: ['outstandingBalance', 'type', 'email'],
    allowedFilters: ['type'],
  }));

  router.get('/suppliers', controller.makeDropdownHandler('suppliers', {
    searchField: 'companyName',
    labelField: ['companyName', 'contactPerson'],
    metaFields: ['phone', 'outstandingBalance', 'paymentTerms'],
  }));

  router.get('/masters', controller.makeDropdownHandler('masters', {
    searchField: 'name',
    labelTemplate: '{{name}} [{{code}}]',
    metaFields: ['type', 'description'],
    allowedFilters: ['type', 'parentId'],
  }));

  router.get('/channels', controller.makeDropdownHandler('channels', {
    searchField: 'name',
    labelField: 'name',
    metaFields: ['description'],
  }));

  router.get('/transfer-requests', controller.makeDropdownHandler('transfer-requests', {
    searchField: 'transferNumber',
    labelTemplate: '{{transferNumber}} — {{status}}',
    metaFields: ['status', 'createdAt'],
  }));

  // 2. Inventory & Master Categories
  router.get('/products', controller.makeDropdownHandler('products', {
    searchField: 'name',
    labelTemplate: '{{name}} ({{sku}})',
    metaFields: ['sellingPrice', 'purchasePrice', 'totalStock', 'category', 'brand', 'sku', 'unit', 'taxRate'],
  }));

  router.get('/purchases', controller.makeDropdownHandler('purchases', {
    searchField: 'invoiceNumber',
    labelField: 'invoiceNumber',
    metaFields: ['grandTotal', 'paymentStatus', 'purchaseDate'],
  }));

  router.get('/sales', controller.makeDropdownHandler('sales', {
    searchField: 'invoiceNumber',
    labelField: 'invoiceNumber',
    metaFields: ['grandTotal', 'paymentStatus', 'saleDate'],
  }));

  router.get('/sales-returns', controller.makeDropdownHandler('sales-returns', {
    searchField: 'returnNumber',
    labelField: 'returnNumber',
    metaFields: ['totalRefundAmount', 'status'],
  }));

  router.get('/purchase-returns', controller.makeDropdownHandler('purchase-returns', {
    searchField: 'returnNumber',
    labelField: 'returnNumber',
    metaFields: ['totalRefundAmount', 'status'],
  }));

  router.get('/master-departments', controller.makeDropdownHandler('masters', {
    searchField: 'name',
    labelField: 'name',
    extraFilter: { type: 'department' },
    metaFields: ['description', 'code'],
  }));

  router.get('/brands', controller.makeDropdownHandler('masters', {
    searchField: 'name',
    labelField: 'name',
    extraFilter: { type: 'brand' },
    metaFields: ['description', 'code'],
  }));

  router.get('/categories', controller.makeDropdownHandler('masters', {
    searchField: 'name',
    labelField: 'name',
    extraFilter: { type: 'category' },
    metaFields: ['description', 'code'],
    allowedFilters: ['parentId'],
  }));

  router.get('/subcategories', controller.makeDropdownHandler('masters', {
    searchField: 'name',
    labelField: 'name',
    extraFilter: { type: 'sub_category' },
    metaFields: ['description', 'code'],
    allowedFilters: ['parentId'],
  }));

  router.get('/sub-categories', controller.makeDropdownHandler('masters', {
    searchField: 'name',
    labelField: 'name',
    extraFilter: { type: 'sub_category' },
    metaFields: ['description', 'code'],
    allowedFilters: ['parentId'],
  }));

  router.get('/units', controller.makeDropdownHandler('masters', {
    searchField: 'name',
    labelTemplate: '{{name}} [{{code}}]',
    extraFilter: { type: 'unit' },
    metaFields: ['description', 'code'],
  }));

  router.get('/tax-rates', controller.makeDropdownHandler('masters', {
    searchField: 'name',
    labelTemplate: '{{name}} [{{code}}]',
    extraFilter: { type: 'tax_rate' },
    metaFields: ['description', 'code'],
  }));

  router.get('/warranty-plans', controller.makeDropdownHandler('masters', {
    searchField: 'name',
    labelField: 'name',
    extraFilter: { type: 'warranty_plan' },
    metaFields: ['description', 'code'],
  }));

  router.get('/product-conditions', controller.makeDropdownHandler('masters', {
    searchField: 'name',
    labelField: 'name',
    extraFilter: { type: 'product_condition' },
    metaFields: ['description', 'code'],
  }));

  router.get('/tags', controller.makeDropdownHandler('masters', {
    searchField: 'name',
    labelField: 'name',
    extraFilter: { type: 'tag' },
    metaFields: ['description', 'code'],
  }));

  router.get('/supplier-categories', controller.makeDropdownHandler('masters', {
    searchField: 'name',
    labelField: 'name',
    extraFilter: { type: 'supplier_category' },
    metaFields: ['description', 'code'],
  }));

  // 3. Accounting
  router.get('/accounts', controller.makeDropdownHandler('accounts', {
    searchField: 'name',
    labelTemplate: '{{code}} — {{name}}',
    metaFields: ['type', 'cachedBalance'],
    allowedFilters: ['type'],
  }));

  router.get('/invoices', controller.makeDropdownHandler('invoices', {
    searchField: 'invoiceNumber',
    labelTemplate: '{{invoiceNumber}} ({{paymentStatus}})',
    metaFields: ['grandTotal', 'dueDate', 'invoiceDate'],
  }));

  router.get('/payments', controller.makeDropdownHandler('payments', {
    searchField: 'referenceNumber',
    labelTemplate: '{{referenceNumber}} — ₹{{amount}}',
    metaFields: ['amount', 'type', 'paymentMethod', 'paymentDate'],
    allowedFilters: ['type'],
  }));

  router.get('/emis', controller.makeDropdownHandler('emis', {
    searchField: 'loanNumber',
    labelField: 'loanNumber',
    metaFields: ['totalAmount', 'balanceAmount', 'status', 'numberOfInstallments'],
  }));

  // 4. HRMS
  router.get('/departments', controller.makeDropdownHandler('departments', {
    searchField: 'name',
    labelField: 'name',
    metaFields: ['description'],
  }));

  router.get('/designations', controller.makeDropdownHandler('designations', {
    searchField: 'title',
    labelField: 'title',
    metaFields: ['level'],
  }));

  router.get('/shifts', controller.makeDropdownHandler('shifts', {
    searchField: 'name',
    labelTemplate: '{{name}} ({{startTime}}–{{endTime}})',
    metaFields: ['startTime', 'endTime', 'workingDays'],
  }));

  router.get('/shift-assignments', controller.makeDropdownHandler('shift-assignments', {
    searchField: 'user',
    labelTemplate: '{{user.name}} - {{shiftId.name}}',
    metaFields: ['startDate', 'endDate', 'status'],
  }));

  router.get('/holidays', controller.makeDropdownHandler('holidays', {
    searchField: 'name',
    labelTemplate: '{{name}} ({{date}})',
    metaFields: ['date', 'type'],
    allowedFilters: ['type'],
  }));

  router.get('/geofencing', controller.makeDropdownHandler('geofencing', {
    searchField: 'name',
    labelTemplate: '{{name}} ({{radius}}m)',
    metaFields: ['radius', 'latitude', 'longitude'],
  }));

  router.get('/attendance-machines', controller.makeDropdownHandler('attendance-machines', {
    searchField: 'name',
    labelField: 'name',
    metaFields: ['ipAddress', 'status', 'connectionStatus'],
  }));

  router.get('/attendance-requests', controller.makeDropdownHandler('attendance-requests', {
    searchField: 'type',
    labelTemplate: '{{user.name}} - {{type}}',
    metaFields: ['targetDate', 'status', 'appliedAt'],
    allowedFilters: ['type', 'status'],
  }));

  router.get('/leave-requests', controller.makeDropdownHandler('leave-requests', {
    searchField: 'leaveType',
    labelTemplate: '{{user.name}} - {{leaveType}}',
    metaFields: ['startDate', 'endDate', 'status', 'daysCount'],
    allowedFilters: ['leaveType', 'status'],
  }));

  // 5. Notes & Meetings
  router.get('/meetings', controller.makeDropdownHandler('meetings', {
    searchField: 'title',
    labelTemplate: '{{title}} ({{startTime}})',
    metaFields: ['startTime', 'endTime', 'status', 'locationType'],
  }));

  return router;
}
