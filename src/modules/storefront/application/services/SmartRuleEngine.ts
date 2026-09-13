import { SmartRuleModel, ISmartRuleDoc } from '../../infrastructure/persistence';
import { ProductModel } from '../../../inventory/infrastructure/persistence';

export interface SmartRuleResult {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  products: any[];
  total: number;
}

export class SmartRuleEngine {
  /**
   * Translates a SmartRule filter array into a MongoDB filter query
   */
  public buildMongoQuery(organizationId: string, filters: ISmartRuleDoc['filters']): Record<string, any> {
    const query: Record<string, any> = {
      organizationId,
      status: 'active',
      storefrontVisible: true,
      isDeleted: false,
    };

    for (const f of filters) {
      if (!f.field || !f.operator) continue;

      const field = f.field;
      switch (f.operator.toLowerCase()) {
        case 'eq':
        case 'equals':
          query[field] = f.value;
          break;
        case 'ne':
        case 'notequals':
          query[field] = { $ne: f.value };
          break;
        case 'gt':
          query[field] = { ...query[field], $gt: Number(f.value) };
          break;
        case 'gte':
          query[field] = { ...query[field], $gte: Number(f.value) };
          break;
        case 'lt':
          query[field] = { ...query[field], $lt: Number(f.value) };
          break;
        case 'lte':
          query[field] = { ...query[field], $lte: Number(f.value) };
          break;
        case 'in':
          query[field] = { $in: Array.isArray(f.value) ? f.value : [f.value] };
          break;
        case 'nin':
          query[field] = { $nin: Array.isArray(f.value) ? f.value : [f.value] };
          break;
        case 'contains':
          query[field] = { $regex: String(f.value), $options: 'i' };
          break;
        case 'between':
          if (f.value !== undefined && f.value2 !== undefined) {
            query[field] = { $gte: Number(f.value), $lte: Number(f.value2) };
          }
          break;
        default:
          query[field] = f.value;
          break;
      }
    }

    return query;
  }

  /**
   * Executes a smart rule by ID or ruleType and returns matching active products
   */
  public async executeRule(organizationId: string, ruleIdOrType: string): Promise<SmartRuleResult | null> {
    const rule = await SmartRuleModel.findOne({
      organizationId,
      isActive: true,
      $or: [{ _id: ruleIdOrType }, { ruleType: ruleIdOrType }],
    });

    if (!rule) return null;

    const mongoQuery = this.buildMongoQuery(organizationId, rule.filters);
    const sortField = rule.sortBy || 'createdAt';
    const sortDirection = rule.sortOrder === 'asc' ? 1 : -1;
    const limit = Math.min(Math.max(rule.limit || 12, 1), 100);

    const [products, total] = await Promise.all([
      ProductModel.find(mongoQuery)
        .sort({ [sortField]: sortDirection })
        .limit(limit)
        .select('name sku slug sellingPrice discountedPrice mrp images categoryId tags totalStock')
        .lean(),
      ProductModel.countDocuments(mongoQuery),
    ]);

    // Update execution stats
    await SmartRuleModel.updateOne(
      { _id: rule._id },
      {
        $set: { lastExecutedAt: new Date() },
        $inc: { executionCount: 1 },
      }
    );

    return {
      ruleId: String(rule._id),
      ruleName: rule.name,
      ruleType: rule.ruleType,
      products,
      total,
    };
  }

  /**
   * Retrieves all active smart rules and their top preview products for an organization
   */
  public async getActiveRulesPreview(organizationId: string): Promise<SmartRuleResult[]> {
    const rules = await SmartRuleModel.find({ organizationId, isActive: true }).lean();
    const results: SmartRuleResult[] = [];

    for (const rule of rules) {
      const res = await this.executeRule(organizationId, String(rule._id));
      if (res) results.push(res);
    }

    return results;
  }
}
