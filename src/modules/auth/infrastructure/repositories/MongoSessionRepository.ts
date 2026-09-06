import { Model } from 'mongoose';
import { ISessionRepository } from '../../domain/ports/ISessionRepository';
import { AuthSession, ACCESS_TOKEN_ROTATION_GRACE_MS } from '../../domain/entities/AuthSession';
import { SessionDocument } from '../persistence/session.model';
import { SessionMapper } from '../../application/mappers/SessionMapper';

export class MongoSessionRepository implements ISessionRepository {
  private readonly model: Model<SessionDocument>;
  private readonly mapper: SessionMapper;

  constructor(model: Model<SessionDocument>, mapper: SessionMapper) {
    this.model = model;
    this.mapper = mapper;
  }

  public async findById(id: string): Promise<AuthSession | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findByAccessTokenHash(accessTokenHash: string): Promise<AuthSession | null> {
    const graceCutoff = new Date(Date.now() - ACCESS_TOKEN_ROTATION_GRACE_MS);
    const doc = await this.model.findOne({
      isValid: true,
      $or: [
        { accessTokenHash },
        { previousAccessTokenHash: accessTokenHash, lastTokenUpdateAt: { $gte: graceCutoff } },
      ],
    }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSession | null> {
    const doc = await this.model.findOne({ refreshTokenHash, isValid: true }).exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  public async findValidByUserId(userId: string): Promise<AuthSession[]> {
    const docs = await this.model.find({ userId, isValid: true }).exec();
    return docs.map((doc) => this.mapper.toDomain(doc));
  }

  public async terminateAllForUser(userId: string, exceptSessionId?: string): Promise<number> {
    const sessions = await this.findValidByUserId(userId);
    let count = 0;
    for (const session of sessions) {
      if (exceptSessionId && session.id === exceptSessionId) continue;
      session.terminate();
      await this.save(session);
      count += 1;
    }
    return count;
  }

  public async save(entity: AuthSession): Promise<AuthSession> {
    const raw = this.mapper.toPersistence(entity);
    const doc = await this.model.findByIdAndUpdate(
      entity.id,
      { $set: raw },
      { upsert: true, new: true, runValidators: true }
    ).exec();
    return this.mapper.toDomain(doc!);
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: id }).exec();
    return (result.deletedCount ?? 0) > 0;
  }
}
