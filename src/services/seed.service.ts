import { ObjectId } from 'mongodb';
import { SourceModel } from '../models/Source';
import { SnippetModel } from '../models/Snippet';
import { AIResponseModel } from '../models/AIResponse';
import { TagModel } from '../models/Tag';
import { normalizeTags } from '../utils/normalize';
import { database } from '../config/database';
import { logger } from '../utils/logger';

export const clearDatabase = async (): Promise<void> => {
  logger.info('Clearing database...');
  const db = database.getDb();
  
  await db.collection('tags').deleteMany({});
  await db.collection('sources').deleteMany({});
  await db.collection('snippets').deleteMany({});
  await db.collection('aiResponses').deleteMany({});
  
  logger.info('Database cleared successfully');
};

export const seedDatabase = async (): Promise<void> => {
  logger.info('Seeding database...');

  const tagModel = new TagModel();
  const sourceModel = new SourceModel();
  const snippetModel = new SnippetModel();
  const aiResponseModel = new AIResponseModel();

  // Create tags
  const tagNames = normalizeTags([
    'mongodb', 'database', 'nosql', 'indexing', 'performance',
    'backend', 'nodejs', 'javascript', 'typescript', 'api',
    'rest', 'express', 'query-optimization', 'data-modeling',
    'postgresql', 'sql', 'relational', 'aggregation','biriyani','dosa','arabic','kozhikode','rice'
  ]);

  const tags = await tagModel.findOrCreate(tagNames);
  const tagMap = new Map(tags.map(tag => [tag.name, tag._id!]));

  // Create sources
  const source1 = await sourceModel.create({
    title: 'MongoDB Indexing Best Practices',
    url: 'https://example.com/mongodb-indexing',
    description: 'Complete guide to MongoDB indexing strategies',
    tagIds: [
      tagMap.get('mongodb')!,
      tagMap.get('database')!,
      tagMap.get('indexing')!,
      tagMap.get('performance')!,
      tagMap.get('nosql')!
    ],
  });

  const source2 = await sourceModel.create({
    title: 'Building REST APIs with Express and TypeScript',
    url: 'https://example.com/express-typescript',
    description: 'Learn how to build scalable REST APIs',
    tagIds: [
      tagMap.get('nodejs')!,
      tagMap.get('typescript')!,
      tagMap.get('express')!,
      tagMap.get('api')!,
      tagMap.get('backend')!
    ],
  });

  const source3 = await sourceModel.create({
    title: 'Database Design Fundamentals',
    url: 'https://example.com/database-design',
    description: 'Understanding relational and non-relational databases',
    tagIds: [
      tagMap.get('database')!,
      tagMap.get('data-modeling')!,
      tagMap.get('sql')!,
      tagMap.get('nosql')!
    ],
  });

  const source4 = await sourceModel.create({
    title: 'Food cultures of kerala',
    url: 'https://kerala-tourism.com',
    description: 'This website explains about the food cultures of various districts of kerala.',
    tagIds: [
      tagMap.get('biriyani')!,
      tagMap.get('dosa')!,
      tagMap.get('kozhikode')!,
      tagMap.get('rice')!
    ],
  });

  const source5 = await sourceModel.create({
    title: 'Authentic Biriyani Recipes',
    url: 'https://example.com/biriyani-recipes',
    description: 'Traditional biriyani recipes from different regions',
    tagIds: [
      tagMap.get('biriyani')!,
      tagMap.get('rice')!,
      tagMap.get('arabic')!
    ],
  })

  // Create snippets
  await snippetModel.create({
    content: 'Compound indexes in MongoDB should follow the ESR rule: Equality, Sort, Range',
    sourceId: source1._id,
    tagIds: [
      tagMap.get('mongodb')!,
      tagMap.get('indexing')!,
      tagMap.get('performance')!,
      tagMap.get('query-optimization')!
    ],
  });

  await snippetModel.create({
    content: 'Use express.json() middleware to parse JSON request bodies',
    sourceId: source2._id,
    tagIds: [
      tagMap.get('express')!,
      tagMap.get('nodejs')!,
      tagMap.get('api')!,
      tagMap.get('backend')!
    ],
  });

  await snippetModel.create({
    content: 'This snippet will only show when the tag is related to database',
    sourceId: source3._id,
    tagIds: [
      tagMap.get('database')!
    ],
  });

  await snippetModel.create({
    content: 'Biriyani is one of the world famous dish.',
    sourceId: source4._id,
    tagIds: [
      tagMap.get('arabic')!,
      tagMap.get('rice')!,
      tagMap.get('biriyani')!
    ]
  });

  await snippetModel.create({
    content: 'Kozhikode biriyani is known for its unique blend of spices and fragrant rice.',
    sourceId: source5._id,
    tagIds: [
      tagMap.get('biriyani')!,
      tagMap.get('kozhikode')!,
      tagMap.get('rice')!
    ]
  })

  // Create AI responses
  await aiResponseModel.create({
    question: 'What is the difference between MongoDB and PostgreSQL?',
    answer: 'MongoDB is a NoSQL document database that stores data in flexible JSON-like documents, while PostgreSQL is a relational database that uses structured tables with predefined schemas. MongoDB excels at handling unstructured data and horizontal scaling, whereas PostgreSQL provides ACID compliance and complex query capabilities.',
    tagIds: [
      tagMap.get('mongodb')!,
      tagMap.get('postgresql')!,
      tagMap.get('database')!,
      tagMap.get('nosql')!,
      tagMap.get('sql')!,
      tagMap.get('relational')!
    ],
  });

  await aiResponseModel.create({
    question: 'How do I optimize MongoDB queries?',
    answer: 'To optimize MongoDB queries: 1) Create appropriate indexes on frequently queried fields, 2) Use compound indexes for multi-field queries, 3) Avoid large skip() operations, 4) Use projection to limit returned fields, 5) Leverage aggregation pipelines for complex operations.',
    tagIds: [
      tagMap.get('mongodb')!,
      tagMap.get('performance')!,
      tagMap.get('query-optimization')!,
      tagMap.get('indexing')!,
      tagMap.get('aggregation')!
    ],
  });

  await aiResponseModel.create({
    question: 'What are the benefits of using TypeScript with Node.js?',
    answer: 'TypeScript adds static typing to JavaScript, providing better IDE support, early error detection, improved code maintainability, and enhanced refactoring capabilities. It helps catch bugs during development rather than runtime.',
    tagIds: [
      tagMap.get('typescript')!,
      tagMap.get('nodejs')!,
      tagMap.get('javascript')!
    ],
  });

  await aiResponseModel.create({
    question: 'What makes biriyani special?',
    answer: 'Biriyani is a flavorful rice dish made with aromatic basmati rice, meat or vegetables, and a blend of spices. The rice is cooked with the ingredients in layers, creating a unique taste and texture.',
    tagIds: [
      tagMap.get('biriyani')!,
      tagMap.get('rice')!,
      tagMap.get('arabic')!
    ],
  });

  // Update usage counts based on actual tag usage across all entities
  const db = database.getDb();
  const sources = await db.collection('sources').find({}).toArray();
  const snippets = await db.collection('snippets').find({}).toArray();
  const aiResponses = await db.collection('aiResponses').find({}).toArray();

  const tagUsageMap = new Map<string, number>();
  
  for (const entity of [...sources, ...snippets, ...aiResponses]) {
    for (const tagId of entity.tagIds) {
      const tagIdStr = tagId.toString();
      tagUsageMap.set(tagIdStr, (tagUsageMap.get(tagIdStr) || 0) + 1);
    }
  }

  for (const [tagIdStr, count] of tagUsageMap.entries()) {
    await tagModel.setUsageCount(new ObjectId(tagIdStr), count);
  }

  logger.info(`Database seeded successfully - ${tagUsageMap.size} tags with usage counts updated`);
};
