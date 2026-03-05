import { ObjectId } from 'mongodb';

// HOW TO ADD A 4TH ENTITY TYPE (e.g., "Collection"):
// Step 1: Add interface here
//   export interface Collection {
//     _id?: ObjectId;
//     name: string;
//     description?: string;
//     tagIds: ObjectId[];
//     createdAt: Date;
//     updatedAt: Date;
//   }
//
// Step 2: Add to EntityType union
//   export type EntityType = 'source' | 'snippet' | 'aiResponse' | 'collection';
//
// Step 3: Create models/Collection.ts (copy Source.ts pattern)
//
// Step 4: Update services (tag.service.ts, search.service.ts) getModel() methods
//
// Step 5: Add indexes in config/indexes.ts (copy pattern)
//
// Step 6: Update seed.service.ts if needed for sample data

export interface Tag {
  _id?: ObjectId;
  name: string;
  embedding?: number[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Source {
  _id?: ObjectId;
  title: string;
  url: string;
  description?: string;
  tagIds: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Snippet {
  _id?: ObjectId;
  content: string;
  sourceId?: ObjectId;
  tagIds: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIResponse {
  _id?: ObjectId;
  question: string;
  answer: string;
  tagIds: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export type EntityType = 'source' | 'snippet' | 'aiResponse';

// Base entity interface - all taggable entities must have these fields
// This enforces consistency across entity types for the tagging system
export interface Entity {
  _id?: ObjectId;
  tagIds: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
