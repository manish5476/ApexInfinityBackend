import mongoose, { Connection, ConnectOptions } from 'mongoose';
import { ILogger } from '../logging/ILogger';

export enum DatabaseStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface DatabaseHealthInfo {
  status: DatabaseStatus;
  host?: string;
  name?: string;
  connectionsCount: number;
}

export class MongoConnectionManager {
  private static instance: MongoConnectionManager | null = null;
  private readonly connections: Map<string, Connection> = new Map();
  private primaryConnection: Connection | null = null;
  private status: DatabaseStatus = DatabaseStatus.DISCONNECTED;
  private logger?: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger;
  }

  public async connect(
    uri: string,
    dbName: string,
    maxPoolSize = 10
  ): Promise<Connection> {
    if (this.primaryConnection && this.primaryConnection.readyState === 1) {
      return this.primaryConnection;
    }

    this.status = DatabaseStatus.CONNECTING;
    this.logger?.info('Connecting to MongoDB...', { uri: this.maskUri(uri), dbName });

    const options: ConnectOptions = {
      dbName,
      maxPoolSize,
      serverSelectionTimeoutMS: 5000,
    };

    try {
      const conn = await mongoose.createConnection(uri, options).asPromise();
      this.primaryConnection = conn;
      this.connections.set(dbName, conn);
      this.status = DatabaseStatus.CONNECTED;

      conn.on('connected', () => {
        this.status = DatabaseStatus.CONNECTED;
        this.logger?.info(`[mongo] Connected to database: ${dbName}`);
      });

      conn.on('disconnected', () => {
        this.status = DatabaseStatus.DISCONNECTED;
        this.logger?.warn(`[mongo] Disconnected from database: ${dbName}`);
      });

      conn.on('error', (err: Error) => {
        this.status = DatabaseStatus.ERROR;
        this.logger?.error(`[mongo] Error on database connection: ${err.message}`, { error: err.stack });
      });

      return conn;
    } catch (error) {
      this.status = DatabaseStatus.ERROR;
      const message = error instanceof Error ? error.message : String(error);
      this.logger?.error(`[mongo] Failed to connect to database: ${message}`);
      throw error;
    }
  }

  public getConnection(dbName?: string): Connection {
    if (dbName && this.connections.has(dbName)) {
      return this.connections.get(dbName)!;
    }
    if (this.primaryConnection) {
      return this.primaryConnection;
    }
    throw new Error('Database not connected. Please ensure MongoConnectionManager.connect() was called.');
  }

  public getHealth(): DatabaseHealthInfo {
    const isReady = this.primaryConnection && this.primaryConnection.readyState === 1;
    return {
      status: isReady ? DatabaseStatus.CONNECTED : this.status,
      host: this.primaryConnection?.host,
      name: this.primaryConnection?.name,
      connectionsCount: this.connections.size,
    };
  }

  public async disconnect(): Promise<void> {
    this.logger?.info('[mongo] Closing all database connections...');
    const closePromises = Array.from(this.connections.values()).map((conn) => conn.close());
    await Promise.all(closePromises);
    this.connections.clear();
    this.primaryConnection = null;
    this.status = DatabaseStatus.DISCONNECTED;
    this.logger?.info('[mongo] All database connections closed successfully.');
  }

  private maskUri(uri: string): string {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  }
}
