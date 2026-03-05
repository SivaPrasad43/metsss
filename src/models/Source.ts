import { Collection, ObjectId } from 'mongodb';
import { database } from '../config/database';
import { Source } from './types';

export class SourceModel {
  private collection: Collection<Source>;

  constructor() {
    this.collection = database.getDb().collection<Source>('sources');
  }

  async create(data: Omit<Source, '_id' | 'createdAt' | 'updatedAt'>): Promise<Source> {
    const source: Source = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(source);
    return { ...source, _id: result.insertedId };
  }

  async findById(id: ObjectId): Promise<Source | null> {
    return this.collection.findOne({ _id: id });
  }

  async attachTags(id: ObjectId, tagIds: ObjectId[]): Promise<void> {
    await this.collection.updateOne(
      { _id: id },
      { 
        $addToSet: { tagIds: { $each: tagIds } },
        $set: { updatedAt: new Date() }
      }
    );
  }

  async searchByTags(tagIds: ObjectId[], mode: 'and' | 'or', skip: number, limit: number): Promise<Source[]> {
    // AND mode: Entity must have ALL specified tags ($all operator)
    // OR mode: Entity must have AT LEAST ONE specified tag ($in operator)
    const query = mode === 'and' 
      ? { tagIds: { $all: tagIds } }
      : { tagIds: { $in: tagIds } };

    // Leverages compound index { tagIds: 1, createdAt: -1 }
    // MongoDB can use this index for both filtering and sorting in a single pass
    return this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }
}
