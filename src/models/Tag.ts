import { Collection, ObjectId } from 'mongodb';
import { database } from '../config/database';
import { Tag } from './types';

export class TagModel {
  private collection: Collection<Tag>;

  constructor() {
    this.collection = database.getDb().collection<Tag>('tags');
  }

  async findOrCreate(tagNames: string[]): Promise<Tag[]> {
    const tags: Tag[] = [];

    for (const name of tagNames) {
      const result = await this.collection.findOneAndUpdate(
        { name },
        {
          $setOnInsert: {
            name,
            usageCount: 0,
            createdAt: new Date(),
          },
          $set: {
            updatedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: 'after' }
      );

      if (result) {
        tags.push(result);
      }
    }

    return tags;
  }

  async incrementUsageCount(tagIds: ObjectId[]): Promise<void> {
    await this.collection.updateMany(
      { _id: { $in: tagIds } },
      { $inc: { usageCount: 1 } }
    );
  }

  async setUsageCount(tagId: ObjectId, count: number): Promise<void> {
    await this.collection.updateOne(
      { _id: tagId },
      { $set: { usageCount: count } }
    );
  }

  async findByIds(tagIds: ObjectId[]): Promise<Tag[]> {
    return this.collection.find({ _id: { $in: tagIds } }).toArray();
  }

  async findByNames(names: string[]): Promise<Tag[]> {
    return this.collection.find({ name: { $in: names } }).toArray();
  }

  async findAll(): Promise<Tag[]> {
    return this.collection.find({}).toArray();
  }

  async findPopularTags(minUsageCount: number): Promise<Tag[]> {
    return this.collection
      .find({ usageCount: { $gte: minUsageCount } })
      .sort({ usageCount: -1 })
      .toArray();
  }

  async updateEmbedding(tagId: ObjectId, embedding: number[]): Promise<void> {
    await this.collection.updateOne(
      { _id: tagId },
      { $set: { embedding, updatedAt: new Date() } }
    );
  }
}
