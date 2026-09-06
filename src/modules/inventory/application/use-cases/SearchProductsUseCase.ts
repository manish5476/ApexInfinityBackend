import { IProductRepository } from '../../domain/ports/IProductRepository';
import { ProductResponseDto } from '../dto/inventory.dto';
import { ProductMapper } from '../mappers/ProductMapper';

export class SearchProductsUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(
    input: { query: string; limit?: number },
    context: { organizationId: string }
  ): Promise<ProductResponseDto[]> {
    const products = await this.productRepo.search({
      organizationId: context.organizationId,
      query: input.query,
      limit: input.limit,
    });

    return products.map(p => ProductMapper.toDto(p));
  }
}
