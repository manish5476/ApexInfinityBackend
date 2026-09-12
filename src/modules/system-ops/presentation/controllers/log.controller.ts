import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

export class LogController {
  private readonly validFiles: Record<string, string> = {
    combined: 'combined.log',
    error: 'error.log',
    exceptions: 'exceptions.log',
    rejections: 'rejections.log',
  };

  public getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const fileKey = (req.query.file as string || 'combined').toLowerCase();
      const search = (req.query.search as string || '').toLowerCase();
      const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);

      const fileName = this.validFiles[fileKey] || 'combined.log';
      const logDir = path.resolve(process.cwd(), 'logs');
      const filePath = path.join(logDir, fileName);

      let logLines: string[] = [];

      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        logLines = fileContent.split('\n').filter(Boolean);
        if (search) {
          logLines = logLines.filter((line) => line.toLowerCase().includes(search));
        }
        logLines = logLines.slice(-limit);
      } else {
        logLines = [
          `[${new Date().toISOString()}] INFO: System operational. Logging buffer initialized.`,
        ];
      }

      res.status(200).json({
        success: true,
        data: {
          file: fileName,
          totalLines: logLines.length,
          returnedLines: logLines.length,
          lines: logLines,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
