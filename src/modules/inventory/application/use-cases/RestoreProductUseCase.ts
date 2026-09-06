import { IProductRepository } from '../../domain/ports/IProductRepository';
import { ProductResponseDto } from '../dto/inventory.dto';
import { ProductMapper } from '../mappers/ProductMapper';

export class RestoreProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(
    input: { id: string },
    context: { organizationId: string }
  ): Promise<ProductResponseDto> {
    const product = await this.productRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!product) {
      throw new Error('Product not found');
    }

    product.restore();
    await this.productRepo.save(product);

    return ProductMapper.toDto(product);
  }
}
