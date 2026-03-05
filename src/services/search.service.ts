import { ObjectId } from 'mongodb';
import { SourceModel } from '../models/Source';
import { SnippetModel } from '../models/Snippet';
import { AIResponseModel } from '../models/AIResponse';
import { EntityType } from '../models/types';
import { SimilarityService } from './similarity.service';
import { normalizeTags } from '../utils/normalize';
import { logger } from '../utils/logger';

export class SearchService {
  private sourceModel: SourceModel;
  private snippetModel: SnippetModel;
  private aiResponseModel: AIResponseModel;
  private similarityService: SimilarityService;

  constructor() {
    this.sourceModel = new SourceModel();
    this.snippetModel = new SnippetModel();
    this.aiResponseModel = new AIResponseModel();
    this.similarityService = new SimilarityService();
  }

  async searchEntities(params: {
    entityType?: EntityType;
    tags: string[];
    mode: 'and' | 'or';
    page: number;
    limit: number;
  }) {
    const { entityType, tags, mode, page, limit } = params;
    
    const normalizedTags = normalizeTags(tags);
    
    if (normalizedTags.length === 0) {
      throw new Error('No valid tags provided');
    }

    // USER THINKING: Semantic expansion improves discovery
    // When a user searches for "mongodb", they likely want content tagged with
    // "database", "nosql", "backend" too - even if they didn't think to search those terms.
    // This surfaces related content they might have missed, improving learning outcomes.
    const expandedTags = await this.similarityService.findSimilarTags(normalizedTags);
    const tagIds = expandedTags.map(tag => tag._id!);
    
    logger.info(`Search: "${normalizedTags.join(', ')}" expanded to ${expandedTags.length} tags`, {
      original: normalizedTags,
      expanded: expandedTags.map(t => t.name)
    });

    const skip = (page - 1) * limit;
    const entityTypes: EntityType[] = entityType ? [entityType] : ['source', 'snippet', 'aiResponse'];

    // SCALABILITY BOTTLENECK #1: Cross-collection queries
    // At 1M+ entities, querying 3 collections sequentially becomes slow (300-500ms)
    // Solutions at scale:
    // - Dedicated search index (Elasticsearch, Typesense)
    // - Materialized views for common queries
    // - Parallel queries with Promise.all() (helps but not enough at scale)
    const results = [];

    for (const type of entityTypes) {
      const model = this.getModel(type);
      const entities = await model.searchByTags(tagIds, mode, skip, limit);
      
      results.push(...entities.map(entity => ({
        ...entity,
        entityType: type
      })));
    }

    // SCALABILITY BOTTLENECK #2: In-memory sorting
    // Sorting combined results in-memory doesn't scale beyond ~10K results
    // At scale, need to push sorting to database or search index
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination to combined results
    const paginatedResults = results.slice(0, limit);

    return {
      results: paginatedResults,
      page,
      limit,
      total: results.length,
      searchTags: normalizedTags,
      expandedTags: expandedTags.map(tag => tag.name),
      // USER THINKING: Show when semantic expansion happened
      // Helps users understand why they're seeing certain results
      // Builds trust in the search system
      semanticExpansion: expandedTags.length > normalizedTags.length
    };
  }

  private getModel(entityType: EntityType) {
    switch (entityType) {
      case 'source':
        return this.sourceModel;
      case 'snippet':
        return this.snippetModel;
      case 'aiResponse':
        return this.aiResponseModel;
      default:
        throw new Error(`Invalid entity type: ${entityType}`);
    }
  }
}
