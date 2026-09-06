import { IProductRepository } from '../../domain/ports/IProductRepository';
import { ListProductsQueryDto, ProductResponseDto } from '../dto/inventory.dto';
import { ProductMapper } from '../mappers/ProductMapper';

export class ListProductsUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(
    dto: ListProductsQueryDto,
    context: { organizationId: string }
  ): Promise<{ data: ProductResponseDto[]; total: number }> {
    const result = await this.productRepo.list({
      organizationId: context.organizationId,
      page: dto.page ?? 1,
      limit: dto.limit ?? 20,
      search: dto.search,
      categoryId: dto.categoryId,
      status: dto.status,
      isDeleted: dto.isDeleted,
    });

    return {
      data: result.data.map(p => ProductMapper.toDto(p)),
      total: result.total,
    };
  }
}
