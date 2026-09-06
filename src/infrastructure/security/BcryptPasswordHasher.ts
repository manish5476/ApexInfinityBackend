import bcrypt from 'bcryptjs';
import { IPasswordHasher } from './IPasswordHasher';

export class BcryptPasswordHasher implements IPasswordHasher {
  private readonly saltRounds: number;

  constructor(saltRounds = 10) {
    this.saltRounds = saltRounds;
  }

  public async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  public async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
