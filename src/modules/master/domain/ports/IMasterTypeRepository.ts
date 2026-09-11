import { MasterType } from '../entities/MasterType';

export interface IMasterTypeRepository {
  findById(id: string): Promise<MasterType | null>;
  findByName(name: string): Promise<MasterType | null>;
  save(masterType: MasterType): Promise<void>;
  list(query?: { isActive?: boolean }): Promise<MasterType[]>;
  delete(id: string): Promise<boolean>;
}
