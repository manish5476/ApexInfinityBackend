/**
 * Bidirectional mapper contract.
 * Translates between Domain Entities and Persistence Documents or Presentation DTOs.
 */
export interface IMapper<TDomain, TPersistence = unknown, TDto = unknown> {
  toDomain(raw: TPersistence): TDomain;
  toPersistence?(entity: TDomain): TPersistence;
  toDto?(entity: TDomain): TDto;
}
