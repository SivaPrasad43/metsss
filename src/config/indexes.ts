import { database } from '../config/database';
import { logger } from '../utils/logger';

export const createIndexes = async (): Promise<void> => {
  logger.info('Creating indexes...');

  const db = database.getDb();

  // Tags collection indexes
  await db.collection('tags').createIndex({ name: 1 }, { unique: true });
  await db.collection('tags').createIndex({ createdAt: 1 });

  // Sources collection indexes
  await db.collection('sources').createIndex({ tagIds: 1, createdAt: -1 });
  await db.collection('sources').createIndex({ createdAt: -1 });

  // Snippets collection indexes
  await db.collection('snippets').createIndex({ tagIds: 1, createdAt: -1 });
  await db.collection('snippets').createIndex({ sourceId: 1 });
  await db.collection('snippets').createIndex({ createdAt: -1 });

  // AIResponses collection indexes
  await db.collection('aiResponses').createIndex({ tagIds: 1, createdAt: -1 });
  await db.collection('aiResponses').createIndex({ createdAt: -1 });

  logger.info('Indexes created successfully');
};
