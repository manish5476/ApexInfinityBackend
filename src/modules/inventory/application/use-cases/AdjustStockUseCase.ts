import { IProductRepository } from '../../domain/ports/IProductRepository';
import { AdjustStockDto, ProductResponseDto } from '../dto/inventory.dto';
import { ProductMapper } from '../mappers/ProductMapper';

export class AdjustStockUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(
    input: AdjustStockDto,
    context: { organizationId: string }
  ): Promise<ProductResponseDto> {
    const product = await this.productRepo.findById({
      id: input.productId,
      organizationId: context.organizationId,
    });

    if (!product) {
      throw new Error('Product not found');
    }

    product.adjustStock(input.branchId, input.delta, input.reason);
    await this.productRepo.save(product);

    return ProductMapper.toDto(product);
  }
}
