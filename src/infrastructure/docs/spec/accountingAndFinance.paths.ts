import { OpenApiPaths, okResponse, createdResponse, jsonBody, pathParam, queryParam } from './types';

export const accountingAndFinancePaths: OpenApiPaths = {
  // --- INVOICES ---
  '/invoices': {
    get: {
      tags: ['Accounting & Invoicing'],
      summary: 'List billing invoices with payment and balance details',
      parameters: [
        queryParam('search', 'Search by invoice number or customer name'),
        queryParam('status', 'Payment status filter (unpaid, partially_paid, paid, overdue)'),
        queryParam('page', 'Page number', 'integer', 1),
        queryParam('limit', 'Page size', 'integer', 20),
      ],
      responses: okResponse('Invoices list'),
    },
    post: {
      tags: ['Accounting & Invoicing'],
      summary: 'Create a new GST-compliant invoice with automatic ledger posting',
      requestBody: jsonBody('CreateInvoiceRequest'),
      responses: createdResponse('Invoice generated', 'InvoiceResponse'),
    },
  },
  '/invoices/{id}': {
    get: {
      tags: ['Accounting & Invoicing'],
      summary: 'Get invoice details by ID',
      parameters: [pathParam('id', 'Invoice ID')],
      responses: okResponse('Invoice details'),
    },
    patch: {
      tags: ['Accounting & Invoicing'],
      summary: 'Update invoice items, discounts, or terms',
      parameters: [pathParam('id', 'Invoice ID')],
      responses: okResponse('Invoice updated'),
    },
    delete: {
      tags: ['Accounting & Invoicing'],
      summary: 'Cancel or void invoice and reverse ledger postings',
      parameters: [pathParam('id', 'Invoice ID')],
      responses: okResponse('Invoice voided'),
    },
  },
  '/invoices/{id}/payments': {
    get: {
      tags: ['Accounting & Invoicing'],
      summary: 'Get payment receipts allocated against this invoice',
      parameters: [pathParam('id', 'Invoice ID')],
      responses: okResponse('Payment allocation records'),
    },
    post: {
      tags: ['Accounting & Invoicing'],
      summary: 'Record a payment against this invoice',
      parameters: [pathParam('id', 'Invoice ID')],
      requestBody: jsonBody({
        type: 'object',
        required: ['amount', 'paymentMethod'],
        properties: {
          amount: { type: 'number', example: 5000 },
          paymentMethod: { type: 'string', enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque'] },
          reference: { type: 'string' },
          notes: { type: 'string' },
        },
      }),
      responses: createdResponse('Payment recorded and applied'),
    },
  },
  '/invoices/pdf/{id}/download': {
    get: {
      tags: ['Accounting & Invoicing'],
      summary: 'Download high-resolution printable PDF for invoice',
      parameters: [pathParam('id', 'Invoice ID')],
      responses: {
        200: {
          description: 'Binary PDF buffer',
          content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
        },
      },
    },
  },

  // --- PAYMENTS ---
  '/payments': {
    get: {
      tags: ['Accounting & Invoicing'],
      summary: 'List payment transaction records',
      parameters: [
        queryParam('page', 'Page', 'integer', 1),
        queryParam('limit', 'Limit', 'integer', 20),
        queryParam('type', 'Filter by type: customer_receipt or supplier_payment'),
      ],
      responses: okResponse('Payments list'),
    },
    post: {
      tags: ['Accounting & Invoicing'],
      summary: 'Record customer receipt or supplier payout',
      requestBody: jsonBody({
        type: 'object',
        required: ['partyId', 'partyType', 'amount', 'paymentMethod'],
        properties: {
          partyId: { type: 'string' },
          partyType: { type: 'string', enum: ['customer', 'supplier'] },
          amount: { type: 'number' },
          paymentMethod: { type: 'string' },
          reference: { type: 'string' },
        },
      }),
      responses: createdResponse('Payment processed'),
    },
  },
  '/payments/{id}': {
    get: {
      tags: ['Accounting & Invoicing'],
      summary: 'Get payment receipt details by ID',
      parameters: [pathParam('id', 'Payment ID')],
      responses: okResponse('Payment details'),
    },
  },

  // --- ACCOUNTS (CHART OF ACCOUNTS) ---
  '/accounts': {
    get: {
      tags: ['Accounting & Invoicing'],
      summary: 'List Chart of Accounts with real-time balances',
      responses: okResponse('Chart of accounts list'),
    },
    post: {
      tags: ['Accounting & Invoicing'],
      summary: 'Create custom ledger account',
      requestBody: jsonBody({
        type: 'object',
        required: ['name', 'code', 'type'],
        properties: {
          name: { type: 'string' },
          code: { type: 'string' },
          type: { type: 'string', enum: ['asset', 'liability', 'equity', 'revenue', 'expense'] },
          parentAccountId: { type: 'string' },
        },
      }),
      responses: createdResponse('Account created'),
    },
  },
  '/accounts/hierarchy': {
    get: {
      tags: ['Accounting & Invoicing'],
      summary: 'Get nested Chart of Accounts tree structure',
      responses: okResponse('Hierarchical tree of accounts'),
    },
  },

  // --- GENERAL LEDGERS ---
  '/ledgers': {
    get: {
      tags: ['Accounting & Invoicing'],
      summary: 'List double-entry ledger journals',
      parameters: [
        queryParam('accountId', 'Filter by account'),
        queryParam('startDate', 'Filter from date', 'string'),
        queryParam('endDate', 'Filter to date', 'string'),
      ],
      responses: okResponse('Ledger journal entries'),
    },
  },
  '/ledgers/summary/trial-balance': {
    get: {
      tags: ['Accounting & Invoicing'],
      summary: 'Generate Trial Balance report (debit vs credit verification)',
      responses: okResponse('Trial balance report'),
    },
  },
  '/ledgers/summary/profit-loss': {
    get: {
      tags: ['Accounting & Invoicing'],
      summary: 'Generate Profit & Loss (Income Statement) report',
      responses: okResponse('Profit and Loss financial report'),
    },
  },
  '/ledgers/summary/balance-sheet': {
    get: {
      tags: ['Accounting & Invoicing'],
      summary: 'Generate Balance Sheet report (Assets = Liabilities + Equity)',
      responses: okResponse('Balance sheet financial report'),
    },
  },
  '/ledgers/cash-flow': {
    get: {
      tags: ['Accounting & Invoicing'],
      summary: 'Generate statement of Cash Flows (Operating, Investing, Financing)',
      responses: okResponse('Cash flow statement'),
    },
  },

  // --- EMI & INSTALLMENT PLANS ---
  '/emi': {
    get: {
      tags: ['Accounting & Invoicing'],
      summary: 'List active customer EMI and installment schedules',
      responses: okResponse('EMI plans list'),
    },
    post: {
      tags: ['Accounting & Invoicing'],
      summary: 'Create custom EMI installment loan for invoice',
      requestBody: jsonBody({
        type: 'object',
        required: ['invoiceId', 'customerId', 'totalAmount', 'numberOfInstallments'],
        properties: {
          invoiceId: { type: 'string' },
          customerId: { type: 'string' },
          totalAmount: { type: 'number' },
          downPayment: { type: 'number', default: 0 },
          numberOfInstallments: { type: 'integer' },
          interestRate: { type: 'number', default: 0 },
        },
      }),
      responses: createdResponse('EMI plan established'),
    },
  },
  '/emi/{id}/pay': {
    post: {
      tags: ['Accounting & Invoicing'],
      summary: 'Record installment payment against EMI schedule',
      parameters: [pathParam('id', 'EMI Plan ID')],
      requestBody: jsonBody({
        type: 'object',
        required: ['installmentNumber', 'amountPaid'],
        properties: {
          installmentNumber: { type: 'integer' },
          amountPaid: { type: 'number' },
        },
      }),
      responses: okResponse('EMI installment paid'),
    },
  },

  // --- RECONCILIATION ---
  '/reconciliation/mismatches': {
    get: {
      tags: ['Accounting & Invoicing'],
      summary: 'List payment gateway vs bank ledger mismatches',
      responses: okResponse('Mismatches report'),
    },
  },
  '/reconciliation/manual': {
    post: {
      tags: ['Accounting & Invoicing'],
      summary: 'Manually reconcile unmatched payment',
      requestBody: jsonBody({
        type: 'object',
        required: ['paymentId', 'bankTransactionId'],
        properties: {
          paymentId: { type: 'string' },
          bankTransactionId: { type: 'string' },
          notes: { type: 'string' },
        },
      }),
      responses: okResponse('Payment reconciled'),
    },
  },

  // --- FINANCIAL STATEMENTS ---
  '/statements/pl': {
    get: {
      tags: ['Accounting & Invoicing'],
      summary: 'Get Profit and Loss statement',
      responses: okResponse('P&L statement data'),
    },
  },
  '/statements/balance-sheet': {
    get: {
      tags: ['Accounting & Invoicing'],
      summary: 'Get Balance Sheet statement',
      responses: okResponse('Balance sheet statement data'),
    },
  },
};
