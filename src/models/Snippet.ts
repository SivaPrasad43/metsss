import { Collection, ObjectId } from 'mongodb';
import { database } from '../config/database';
import { Snippet } from './types';

export class SnippetModel {
  private collection: Collection<Snippet>;

  constructor() {
    this.collection = database.getDb().collection<Snippet>('snippets');
  }

  async create(data: Omit<Snippet, '_id' | 'createdAt' | 'updatedAt'>): Promise<Snippet> {
    const snippet: Snippet = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(snippet);
    return { ...snippet, _id: result.insertedId };
  }

  async findById(id: ObjectId): Promise<Snippet | null> {
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

  async searchByTags(tagIds: ObjectId[], mode: 'and' | 'or', skip: number, limit: number): Promise<Snippet[]> {
    const query = mode === 'and' 
      ? { tagIds: { $all: tagIds } }
      : { tagIds: { $in: tagIds } };

    return this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }
}
