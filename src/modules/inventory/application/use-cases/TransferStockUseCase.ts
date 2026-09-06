import { IProductRepository } from '../../domain/ports/IProductRepository';
import { TransferStockDto, ProductResponseDto } from '../dto/inventory.dto';
import { ProductMapper } from '../mappers/ProductMapper';

export class TransferStockUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(
    input: TransferStockDto,
    context: { organizationId: string }
  ): Promise<ProductResponseDto> {
    const product = await this.productRepo.findById({
      id: input.productId,
      organizationId: context.organizationId,
    });

    if (!product) {
      throw new Error('Product not found');
    }

    product.transferStock(input.fromBranchId, input.toBranchId, input.quantity);
    await this.productRepo.save(product);

    return ProductMapper.toDto(product);
  }
}
