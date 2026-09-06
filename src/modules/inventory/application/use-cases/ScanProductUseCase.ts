import { IProductRepository } from '../../domain/ports/IProductRepository';
import { ProductResponseDto } from '../dto/inventory.dto';
import { ProductMapper } from '../mappers/ProductMapper';

export class ScanProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(
    input: { code: string },
    context: { organizationId: string }
  ): Promise<ProductResponseDto> {
    const product = await this.productRepo.findByScan({
      code: input.code,
      organizationId: context.organizationId,
    });

    if (!product) {
      throw new Error(`Product not found for scan code '${input.code}'`);
    }

    return ProductMapper.toDto(product);
  }
}
