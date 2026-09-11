import { Request, Response, NextFunction } from 'express';
import { DropdownUseCases } from '../../application/use-cases/DropdownUseCases';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';
import { DropdownQueryOptions } from '../../domain/ports/IDropdownRepository';

export class DropdownController {
  constructor(private readonly dropdownUseCases: DropdownUseCases) {}

  public makeDropdownHandler = (
    resource: string,
    defaultConfig: Partial<DropdownQueryOptions> = {}
  ) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const ctx = RequestContextHolder.get()!;
        const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

        const includeIds = req.query.includeIds
          ? (req.query.includeIds as string).split(',').map((s) => s.trim())
          : undefined;

        const excludeIds = req.query.excludeIds
          ? (req.query.excludeIds as string).split(',').map((s) => s.trim())
          : undefined;

        let isActive: boolean | 'all' | undefined = undefined;
        if (req.query.isActive === 'all') {
          isActive = 'all';
        } else if (req.query.isActive !== undefined) {
          isActive = req.query.isActive === 'true';
        }

        const options: DropdownQueryOptions = {
          organizationId: ctx.organizationId!,
          search: req.query.search as string | undefined,
          searchField: (req.query.searchField as string) || defaultConfig.searchField,
          labelField: (req.query.labelField as string) || defaultConfig.labelField,
          labelTemplate: defaultConfig.labelTemplate,
          valueField: (req.query.valueField as string) || defaultConfig.valueField || '_id',
          metaFields: defaultConfig.metaFields,
          extraFilter: defaultConfig.extraFilter,
          allowedFilters: defaultConfig.allowedFilters,
          filterParams: req.query as Record<string, unknown>,
          includeIds,
          excludeIds,
          isActive,
          page,
          limit,
        };

        const result = await this.dropdownUseCases.getDropdown(resource, options);

        res.status(200).json({
          status: 'success',
          results: result.data.length,
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          hasMore: result.hasMore,
          data: result.data,
        });
      } catch (err) {
        next(err);
      }
    };
  };
}
