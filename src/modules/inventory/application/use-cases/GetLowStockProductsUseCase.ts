import { IProductRepository } from '../../domain/ports/IProductRepository';
import { ProductResponseDto } from '../dto/inventory.dto';
import { ProductMapper } from '../mappers/ProductMapper';

export class GetLowStockProductsUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(
    input: { branchId?: string; limit?: number },
    context: { organizationId: string }
  ): Promise<ProductResponseDto[]> {
    const products = await this.productRepo.findLowStock({
      organizationId: context.organizationId,
      branchId: input.branchId,
      limit: input.limit,
    });

    return products.map(p => ProductMapper.toDto(p));
  }
}
