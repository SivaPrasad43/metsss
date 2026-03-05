import { Collection, ObjectId } from 'mongodb';
import { database } from '../config/database';
import { AIResponse } from './types';

export class AIResponseModel {
  private collection: Collection<AIResponse>;

  constructor() {
    this.collection = database.getDb().collection<AIResponse>('aiResponses');
  }

  async create(data: Omit<AIResponse, '_id' | 'createdAt' | 'updatedAt'>): Promise<AIResponse> {
    const aiResponse: AIResponse = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.insertOne(aiResponse);
    return { ...aiResponse, _id: result.insertedId };
  }

  async findById(id: ObjectId): Promise<AIResponse | null> {
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

  async searchByTags(tagIds: ObjectId[], mode: 'and' | 'or', skip: number, limit: number): Promise<AIResponse[]> {
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
