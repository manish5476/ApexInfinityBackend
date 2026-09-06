import { IProductRepository } from '../../domain/ports/IProductRepository';

export class DeleteProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(
    input: { id: string },
    context: { organizationId: string }
  ): Promise<{ message: string }> {
    const product = await this.productRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!product) {
      throw new Error('Product not found');
    }

    product.softDelete();
    await this.productRepo.save(product);

    return { message: 'Product deleted successfully' };
  }
}
