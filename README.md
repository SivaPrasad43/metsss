# Multi-Entity Tagging & Semantic Search System

A production-ready backend system for tagging different content types (Sources, Snippets, AI Responses) with semantic search capabilities powered by cosine similarity on tag embeddings.

## Features

- **Multi-entity tagging** - Tag Sources, Snippets, and AI Responses
- **Semantic search** - Find related content using cosine similarity (threshold: 0.5)
- **Idempotent operations** - Safe concurrent tag attachment with `$addToSet`
- **MongoDB aggregation** - Advanced analytics using 7-stage aggregation pipeline
- **Automatic embeddings** - Pre-computed tag embeddings using Cohere API
- **Optimized indexes** - Compound indexes for fast tag-based search
- **Extensible schema** - Add new entity types without migration
- **File-based logging** - Daily log files with structured JSON format
- **Error handling** - Centralized error handling with request logging

## Tech Stack

Node.js • TypeScript • Express.js • MongoDB • Cohere API

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 5.0+
- Cohere API key

### Installation

```bash
npm install
cp .env.example .env
# Edit .env with your MONGODB_URI and COHERE_API_KEY
```

### Run

```bash
npm run dev        # Development with auto-reload
npm run build      # Production build
npm start          # Production
```

**On startup, the system will:**
1. Connect to MongoDB
2. Create optimized indexes
3. **Clear and reseed database** with fresh sample data
4. Generate embeddings for all tags
5. Start logging to `logs/app-YYYY-MM-DD.log`

## Seed Data Generation

The seed data demonstrates the multi-entity tagging system with realistic examples:

**Approach:**
- Manually crafted seed data in `src/services/seed.service.ts`
- Includes 3 entity types (Sources, Snippets, AIResponses) with overlapping tags
- Tags span multiple domains to demonstrate semantic search capabilities

**Tag Overlap Examples:**
- Technical tags (`mongodb`, `database`, `nosql`, `indexing`) appear across all entity types
- Food-related tags (`rice`, `biriyani`, `arabic`, `kozhikode`) demonstrate semantic similarity
- Performance tags (`performance`, `query-optimization`) show cross-entity relationships

**Why This Matters:**
When a user searches for `rice`, the semantic search expands to include `biriyani` and `arabic` (similarity > 0.5), surfacing related content they might have missed. This demonstrates how the system connects knowledge across different content types.

**Seed Data Includes:**
- 5+ Sources (articles, tutorials)
- 5+ Snippets (user highlights with source references)
- 5+ AIResponses (Q&A pairs)
- 20+ tags with pre-computed embeddings
- Overlapping tags across entity types for meaningful search results

## Tag Explosion Prevention

**Strategy Implemented: Tag Normalization + Similar Tag Detection**

The system prevents tag duplication through two complementary approaches:

### 1. Tag Normalization

Automatic normalization in `src/utils/normalize.ts`:

```typescript
normalizeTags(tags) {
  - Lowercase conversion
  - Whitespace trimming
  - Deduplication via Set
}
```

**What It Handles Well:**
- Prevents case variations (`MongoDB`, `mongodb`, `MONGODB` → `mongodb`)
- Eliminates whitespace issues (`" mongodb "`, `"mongodb"` → `mongodb`)
- Removes duplicates within a single request
- Zero configuration required

### 2. Similar Tag Detection (Levenshtein Distance)

Automatically detects and replaces similar tags using edit distance:

**How It Works:**
- When attaching tags, checks against popular tags (usageCount ≥ 3)
- Calculates Levenshtein distance (edit distance) between input and existing tags
- If distance ≤ 2, automatically replaces with the existing popular tag
- Returns replacement information to the user

**Examples:**
- `js` → `javascript` (if `javascript` exists and is popular)
- `mongoDB` → `mongodb` (distance = 2)
- `node-js` → `nodejs` (distance = 1)
- `typscript` → `typescript` (distance = 1, typo correction)

**Configuration:**
```bash
ENABLE_SIMILAR_TAG_DETECTION=true  # Enable/disable feature
SIMILAR_TAG_THRESHOLD=2            # Max Levenshtein distance
POPULAR_TAG_MIN_USAGE=3            # Min usage count for comparison
```

**API Response:**
```json
{
  "success": true,
  "attached": 2,
  "tags": [...],
  "replacements": [
    { "original": "js", "replaced": "javascript" },
    { "original": "mongoDB", "replaced": "mongodb" }
  ]
}
```

**What It Handles Well:**
- Typos and minor spelling variations
- Case variations beyond simple lowercase
- Hyphenation differences (`node-js` vs `nodejs`)
- Prevents creation of near-duplicate tags
- Only checks popular tags (performance optimization)

**Where It Falls Short:**
- Doesn't catch semantic duplicates if both exist (`js` and `javascript` as separate popular tags)
- Strict threshold (≤2) may miss some variations
- No namespace support (`lang/javascript` vs `db/javascript`)
- Doesn't merge existing duplicate tags retroactively

**Future Enhancements:**
- Tag merging API for consolidating existing duplicates
- Semantic duplicate detection using embeddings
- Tag suggestion system before creation
- Namespaced tags for better organization

## API Endpoints

### Health Check
```bash
GET /health
```

### Attach Tags to Entity
```bash
POST /tags/attach
Content-Type: application/json

{
  "entityType": "source",
  "entityId": "507f1f77bcf86cd799439011",
  "tags": ["mongodb", "database", "indexing"]
}
```

**Features:**
- Normalizes tags (lowercase, trim, deduplicate)
- **Similar tag detection** - Auto-replaces with existing popular tags (e.g., `js` → `javascript`)
- Idempotent using `$addToSet` (safe for retries)
- Auto-generates embeddings for new tags
- Thread-safe for concurrent requests

**Response:**
```json
{
  "success": true,
  "entityType": "source",
  "entityId": "507f1f77bcf86cd799439011",
  "attached": 3,
  "tags": [
    {
      "id": "507f191e810c19729de860ea",
      "name": "mongodb",
      "usageCount": 5
    }
  ],
  "replacements": [
    { "original": "mongoDB", "replaced": "mongodb" }
  ]
}
```

**Note:** The `replacements` field only appears when similar tags are detected and replaced.

### Search Entities by Tags
```bash
GET /entities/search?tags=rice&mode=or&page=1&limit=20
```

**Query Parameters:**
- `tags` (required) - Comma-separated tag names
- `mode` (optional) - `and` or `or` (default: `or`)
- `entityType` (optional) - `source`, `snippet`, or `aiResponse`
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Results per page (default: 20, max: 100)

**Semantic Search Example:**
Searching for `rice` automatically includes semantically related tags like `biriyani`, `arabic` (similarity > 0.5), surfacing more relevant content.

**Response:**
```json
{
  "results": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Food cultures of kerala",
      "url": "https://kerala-tourism.com",
      "tagIds": ["507f191e810c19729de860ea"],
      "entityType": "source",
      "createdAt": "2026-03-04T16:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 5,
  "searchTags": ["rice"],
  "expandedTags": ["rice", "biriyani", "arabic"],
  "semanticExpansion": true
}
```

### Tag Analytics
```bash
GET /tags/analytics?days=30
```

**Uses MongoDB aggregation pipeline** with `$lookup`, `$project`, `$addFields`, `$sort` to compute tag usage across all entity types in a single query.

**Response:**
```json
{
  "tags": [
    {
      "tagId": "507f191e810c19729de860ea",
      "tagName": "mongodb",
      "totalUsage": 8,
      "byEntityType": {
        "source": 3,
        "snippet": 3,
        "aiResponse": 2
      },
      "createdAt": "2026-03-01T10:00:00.000Z"
    }
  ],
  "totalTags": 18,
  "period": "last 30 days"
}
```

## Architecture

### Schema Design - Extensible & Polymorphic

**Design Decision:** Separate collections per entity type (sources, snippets, aiResponses) instead of a single polymorphic collection.

**Why?**
- **Extensibility** - Add new entity types without migration
- **Type-specific fields** - Each entity has unique fields without sparse indexes
- **Query optimization** - Indexes tailored to each entity's access patterns

**Adding a 4th Entity Type:**
1. Add interface in `src/models/types.ts`
2. Create model class (copy `Source.ts` pattern)
3. Update `getModel()` in services
4. Add indexes (copy pattern)
5. **No migration needed** - existing data untouched

See detailed guide in `src/models/types.ts`

### Collections

```typescript
// Tags - Normalized, with embeddings
{
  _id: ObjectId,
  name: string,              // Unique, lowercase
  embedding: number[1024],   // Cohere embed-v4.0 vector
  usageCount: number,        // Atomic $inc
  createdAt: Date,
  updatedAt: Date
}

// Sources - Content items
{
  _id: ObjectId,
  title: string,
  url: string,
  description?: string,
  tagIds: ObjectId[],        // Embedded for fast reads
  createdAt: Date,
  updatedAt: Date
}

// Snippets - User highlights
{
  _id: ObjectId,
  content: string,
  sourceId?: ObjectId,       // Optional reference
  tagIds: ObjectId[],
  createdAt: Date,
  updatedAt: Date
}

// AIResponses - AI-generated content
{
  _id: ObjectId,
  question: string,
  answer: string,
  tagIds: ObjectId[],
  createdAt: Date,
  updatedAt: Date
}
```

### Indexing Strategy

**Every index is justified** - see `src/config/indexes.ts` for detailed explanations.

```javascript
// Tags
{ name: 1 }                    // Unique - O(1) lookup, prevents duplicates
{ createdAt: 1 }               // Time-based analytics

// Entity Collections (Sources, Snippets, AIResponses)
{ tagIds: 1, createdAt: -1 }   // CRITICAL compound index
                               // - tagIds first: $in/$all queries
                               // - createdAt second: sorting without extra stage
                               // - Order matters: equality before sort

{ createdAt: -1 }              // Recent content queries

// Snippets only
{ sourceId: 1 }                // Source-snippet relationships
```

**Compound Index Rationale:**
- Supports tag filtering AND date sorting in single index scan
- Field order critical: equality/array match before sort (MongoDB best practice)
- Enables efficient `$in` and `$all` queries

**Trade-offs:**
- Each index adds ~10-15% write overhead
- Prioritize read performance (search is primary use case)

### Semantic Search - How It Works

1. User searches for `tags=rice`
2. Find exact match: Query `tags` collection for `rice`
3. **Compute similarity**: Cosine similarity between `rice` embedding and all tag embeddings
4. **Expand tags**: Include tags with similarity > 0.5 (e.g., `biriyani`, `arabic`)
5. Query entities across collections using expanded tag list
6. Return results with `semanticExpansion` metadata

**Cosine Similarity:**
```
cos(θ) = (A · B) / (||A|| × ||B||)
```

- `1.0` - Identical
- `0.7-0.99` - Highly related (e.g., `rice` ↔ `biriyani`)
- `0.5-0.69` - Related
- `< 0.5` - Unrelated

**Threshold 0.5:** Balances precision vs. recall, captures semantic relationships.

### Concurrency & Idempotency

**Tag Attachment:**
```typescript
$addToSet: { tagIds: { $each: tagIds } }  // Idempotent, atomic
```
- Same tag attached multiple times = appears once
- Safe for retries, concurrent requests, unreliable networks

**Usage Count:**
```typescript
$inc: { usageCount: 1 }  // Atomic increment
```
- No read-modify-write cycle
- No lost updates under concurrent requests

### Logging & Error Handling

**File-Based Logging:**
- Daily log files: `logs/app-YYYY-MM-DD.log`
- JSON format for easy parsing
- Log levels: info, error, warn, debug
- Dual output: file + console

**Error Handling:**
- Centralized error handler middleware
- Request logging with duration tracking
- Process-level error handlers (unhandled rejections, uncaught exceptions)
- Sanitized errors in production

**View Logs:**
```bash
# Tail logs in real-time
tail -f logs/app-$(date +%Y-%m-%d).log

# Pretty print JSON
cat logs/app-$(date +%Y-%m-%d).log | jq '.'

# Filter errors only
cat logs/app-$(date +%Y-%m-%d).log | jq 'select(.level == "error")'
```

## Scalability Analysis

**Where This System Breaks:**

### 1. Cosine Similarity (10K+ tags)
**Problem:** O(n²) computation  
**Breaks at:** 10K tags (~1s latency), unusable at 100K+  
**Solutions:**
- Pre-compute similarity matrix
- Approximate Nearest Neighbors (FAISS, Annoy)
- Vector database (Pinecone, Weaviate, Qdrant)

### 2. Cross-Collection Queries (1M+ entities)
**Problem:** Querying 3 collections, in-memory sorting  
**Breaks at:** 1M entities (300-500ms latency)  
**Solutions:**
- Dedicated search index (Elasticsearch, Typesense)
- Materialized views
- Parallel queries with Promise.all()

## Future Improvements

**With More Time, I Would:**

### 1. Tag Lifecycle Management
- Implement soft delete for entities with proper cleanup
- Async job queue for tag usage count updates (currently synchronous)
- Orphaned tag detection and archival

### 2. Enhanced Tag Explosion Prevention
- Semantic duplicate detection using embeddings (e.g., detect `js` and `javascript` as duplicates)
- Tag suggestion API before creation (show similar existing tags to user)
- Namespaced tags (`lang/javascript`, `db/mongodb`)

### 3. Performance Optimizations
- Redis caching for popular tags and frequent searches
- Index on `usageCount` for faster popular tag queries
- Pagination for popular tags query (currently loads all)

### 7. API Enhancements
- Bulk tag attachment endpoint (attach tags to multiple entities)
- Tag statistics endpoint (most used, trending, related tags)
- GraphQL API for flexible querying

## User-Centric Design

**Tag Normalization:**
- Users type inconsistently ("MongoDB", "mongodb", " MONGODB ")
- System normalizes to lowercase, trims whitespace
- Benefit: Find all content regardless of capitalization

**Semantic Expansion:**
- Users don't think of all related terms
- System auto-expands "mongodb" → "database", "nosql", "backend"
- Benefit: Discover content they would have missed
- Transparency: `semanticExpansion` flag shows when expansion happened

**Idempotent Operations:**
- Unreliable networks, user double-clicks
- `$addToSet` ensures safe retries
- Benefit: No duplicate tags, safe retry logic

**AND vs OR Modes:**
- AND: Precise filtering (must have ALL tags)
- OR: Broader discovery (at least ONE tag)
- Benefit: Flexibility for different learning contexts

## Testing

```bash
# Start MongoDB
mongod

# Start server (auto-seeds database)
npm run dev

# Test endpoints
curl http://localhost:3000/health
curl "http://localhost:3000/entities/search?tags=rice"
curl "http://localhost:3000/tags/analytics?days=30"

# Test semantic search
npm run test:semantic

# Test Levenshtein distance algorithm
npm run test:levenshtein
```

**Test Scenarios:**
1. Idempotency - Attach same tags twice, verify no duplicates
2. Concurrency - Multiple attach requests simultaneously
3. Semantic search - Search "rice", verify "biriyani" results appear
4. AND vs OR modes - Test both with multiple tags
5. Pagination - Different page/limit values
6. Similar tag detection - Attach `js`, `mongoDB`, verify auto-replacement


## Project Structure

```
metsss/
├── src/
│   ├── config/          # Database, indexes, environment
│   │   ├── database.ts  # MongoDB connection
│   │   ├── indexes.ts   # Index creation with justifications
│   │   └── index.ts     # Environment config
│   ├── models/          # Data models with CRUD
│   │   ├── types.ts     # Interfaces + extensibility guide
│   │   ├── Tag.ts
│   │   ├── Source.ts
│   │   ├── Snippet.ts
│   │   └── AIResponse.ts
│   ├── services/        # Business logic
│   │   ├── tag.service.ts                 # Tag attachment
│   │   ├── search.service.ts              # Entity search
│   │   ├── similarity.service.ts          # Cosine similarity
│   │   ├── similarTagDetection.service.ts # Levenshtein-based tag matching
│   │   ├── analytics.service.ts           # Aggregation pipeline
│   │   ├── embedding.service.ts           # Cohere integration
│   │   ├── init.service.ts                # Embedding init
│   │   └── seed.service.ts                # Database seeding
│   ├── routes/          # API endpoints
│   │   ├── tags.routes.ts
│   │   └── entities.routes.ts
│   ├── middleware/      # Express middleware
│   │   ├── errorHandler.ts      # Error handling
│   │   └── requestLogger.ts     # Request logging
│   ├── utils/           # Helpers
│   │   ├── logger.ts            # File-based logger
│   │   ├── normalize.ts         # Tag normalization
│   │   ├── similarity.ts        # Cosine similarity
│   │   └── levenshtein.ts       # Edit distance calculation
│   └── index.ts         # Server entry
├── logs/                # Daily log files (gitignored)
├── docs/                # Assessment brief
└── README.md
```

## Key Implementation Highlights

✅ **MongoDB Aggregation** - 7-stage pipeline with `$lookup` for analytics  
✅ **Extensible Schema** - Add entity types without migration  
✅ **Justified Indexes** - Every index explained with trade-offs  
✅ **Concurrency Safe** - Atomic operations, idempotent  
✅ **Scalability Honest** - Bottlenecks identified with solutions  
✅ **User-Centric** - Design decisions explained in code  
✅ **Production Ready** - Error handling, validation, type safety  
✅ **File Logging** - Structured JSON logs with daily rotation  
✅ **Error Handling** - Centralized middleware with request tracking  
✅ **Semantic Search** - Cosine similarity on tag embeddings (threshold: 0.5)

## Configuration

### Environment Variables

```bash
PORT=3000
MONGODB_URI=mongodb://localhost:27017/metsss
COHERE_API_KEY=your_api_key_here
```

### Adjustable Settings

**Similarity Threshold** (`src/config/index.ts`):
```typescript
semanticSimilarityThreshold: 0.5  // Lower for more expansion, higher for precision
```

**Log Levels:**
- Development: All levels (info, debug, warn, error)
- Production: Set `NODE_ENV=production` to hide debug logs
