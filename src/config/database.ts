import { MongoClient, Db } from 'mongodb';
import { config } from '../config';

class Database {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(): Promise<Db> {
    if (this.db) return this.db;

    try {
      this.client = new MongoClient(config.mongoUri);
      await this.client.connect();
      this.db = this.client.db();
      console.log('MongoDB connected successfully');
      return this.db;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('MongoDB disconnected');
    }
  }
}

export const database = new Database();
