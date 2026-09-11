import { Request, Response, NextFunction } from 'express';
import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository';
import { IEmailSender } from '../../../../infrastructure/email/IEmailSender';
import { AuthenticatedUser } from '../../../../middleware/auth.middleware';
import { NotFoundError, UnauthorizedError } from '../../../../shared/errors';
import PDFDocument from 'pdfkit';

export class InvoicePDFController {
  private readonly invoiceRepo: IInvoiceRepository;
  private readonly emailSender: IEmailSender;

  constructor(invoiceRepo: IInvoiceRepository, emailSender: IEmailSender) {
    this.invoiceRepo = invoiceRepo;
    this.emailSender = emailSender;
  }

  public downloadInvoicePDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      if (!user?.organizationId) {
        throw new UnauthorizedError('Organization ID is required');
      }
      const invoice = await this.invoiceRepo.findById({ id: req.params.id as string, organizationId: user.organizationId });

      if (!invoice || invoice.organizationId !== user.organizationId) {
        throw new NotFoundError('Invoice not found');
      }

      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="invoice_${invoice.invoiceNumber}.pdf"`);
        res.status(200).send(pdfData);
      });

      // Header
      doc.fontSize(20).text('TAX INVOICE', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNumber}`);
      doc.text(`Date: ${invoice.props.invoiceDate ? invoice.props.invoiceDate.toISOString().slice(0, 10) : ''}`);
      doc.text(`Due Date: ${invoice.props.dueDate ? invoice.props.dueDate.toISOString().slice(0, 10) : 'N/A'}`);
      doc.text(`Status: ${invoice.status.toUpperCase()}`);
      doc.moveDown();

      // Items
      doc.fontSize(14).text('Items:');
      doc.fontSize(10);
      for (const item of invoice.items) {
        const lineTotal = (item.price * item.quantity).toFixed(2);
        doc.text(`${item.name} - Qty: ${item.quantity} x $${item.price} = $${lineTotal}`);
      }
      doc.moveDown();

      // Totals
      doc.fontSize(12).text(`Subtotal: $${invoice.props.subTotal}`);
      doc.text(`Tax: $${invoice.props.totalTax}`);
      doc.text(`Discount: $${invoice.props.totalDiscount}`);
      doc.fontSize(14).text(`Total: $${invoice.grandTotal}`, { underline: true });

      doc.end();
    } catch (err) {
      next(err);
    }
  };

  public emailInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      if (!user?.organizationId) {
        throw new UnauthorizedError('Organization ID is required');
      }
      const invoice = await this.invoiceRepo.findById({ id: req.params.id as string, organizationId: user.organizationId });

      if (!invoice || invoice.organizationId !== user.organizationId) {
        throw new NotFoundError('Invoice not found');
      }

      const recipientEmail = req.body.email || req.body.to || 'customer@example.com';

      await this.emailSender.send({
        to: recipientEmail,
        subject: `Invoice #${invoice.invoiceNumber} from Apex`,
        html: `<p>Dear Customer,</p><p>Please find details for invoice <strong>#${invoice.invoiceNumber}</strong> for the amount of <strong>$${invoice.grandTotal}</strong>.</p><p>Due Date: ${invoice.props.dueDate ? invoice.props.dueDate.toISOString().slice(0, 10) : 'N/A'}</p>`,
      });

      res.status(200).json({
        status: 'success',
        message: 'Invoice emailed successfully',
      });
    } catch (err) {
      next(err);
    }
  };
}
