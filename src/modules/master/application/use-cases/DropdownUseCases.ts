import { IDropdownRepository, DropdownQueryOptions, DropdownResult } from '../../domain/ports/IDropdownRepository';

export class DropdownUseCases {
  constructor(private readonly dropdownRepo: IDropdownRepository) {}

  async getDropdown(resource: string, options: DropdownQueryOptions): Promise<DropdownResult> {
    return this.dropdownRepo.getDropdown(resource, options);
  }
}
