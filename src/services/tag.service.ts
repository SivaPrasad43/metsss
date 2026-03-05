import { ObjectId } from 'mongodb';
import { TagModel } from '../models/Tag';
import { SourceModel } from '../models/Source';
import { SnippetModel } from '../models/Snippet';
import { AIResponseModel } from '../models/AIResponse';
import { EntityType } from '../models/types';
import { normalizeTags } from '../utils/normalize';
import { embeddingService } from './embedding.service';
import { SimilarTagDetectionService } from './similarTagDetection.service';
import { config } from '../config';
import { logger } from '../utils/logger';

export class TagService {
  private tagModel: TagModel;
  private sourceModel: SourceModel;
  private snippetModel: SnippetModel;
  private aiResponseModel: AIResponseModel;
  private similarTagDetectionService: SimilarTagDetectionService;

  constructor() {
    this.tagModel = new TagModel();
    this.sourceModel = new SourceModel();
    this.snippetModel = new SnippetModel();
    this.aiResponseModel = new AIResponseModel();
    this.similarTagDetectionService = new SimilarTagDetectionService();
  }

  async attachTags(entityType: EntityType, entityId: string, tagNames: string[]) {
    const normalizedTags = normalizeTags(tagNames);
    
    if (normalizedTags.length === 0) {
      throw new Error('No valid tags provided');
    }

    const objectId = new ObjectId(entityId);

    // Verify entity exists - fail fast with clear error message
    const model = this.getModel(entityType);
    const entity = await model.findById(objectId);
    
    if (!entity) {
      throw new Error(`${entityType} not found`);
    }

    // Similar tag detection - replace with existing popular tags
    const replacements: Array<{ original: string; replaced: string }> = [];
    let finalTags = normalizedTags;

    if (config.enableSimilarTagDetection) {
      logger.debug(`Similar tag detection enabled (threshold: ${config.similarTagLevenshteinThreshold}, min usage: ${config.popularTagMinUsageCount})`);
      
      const popularTags = await this.tagModel.findPopularTags(config.popularTagMinUsageCount);
      logger.debug(`Found ${popularTags.length} popular tags for comparison`);
      
      finalTags = normalizedTags.map(tagName => {
        const similarTag = this.similarTagDetectionService.findSimilarTag(tagName, popularTags);
        
        if (similarTag) {
          replacements.push({ original: tagName, replaced: similarTag.name });
          return similarTag.name;
        }
        
        return tagName;
      });

      // Remove duplicates after replacement
      finalTags = [...new Set(finalTags)];
      
      if (replacements.length > 0) {
        logger.info(`Tag replacements made: ${replacements.length}`, { replacements });
      } else {
        logger.debug('No tag replacements needed');
      }
    } else {
      logger.debug('Similar tag detection disabled');
    }

    // Find or create tags - idempotent operation
    const tags = await this.tagModel.findOrCreate(finalTags);
    
    // Generate embeddings for new tags
    if (config.cohereApiKey) {
      const tagsWithoutEmbeddings = tags.filter(tag => !tag.embedding);
      if (tagsWithoutEmbeddings.length > 0) {
        const embeddings = await embeddingService.generateEmbeddings(
          tagsWithoutEmbeddings.map(t => t.name)
        );
        
        for (let i = 0; i < tagsWithoutEmbeddings.length; i++) {
          await this.tagModel.updateEmbedding(tagsWithoutEmbeddings[i]._id!, embeddings[i]);
        }
      }
    }

    const tagIds = tags.map(tag => tag._id!);

    // Attach tags to entity (idempotent with $addToSet)
    await model.attachTags(objectId, tagIds);

    // Increment usage counts
    await this.tagModel.incrementUsageCount(tagIds);

    return { tags, attached: tagIds.length, replacements: replacements.length > 0 ? replacements : undefined };
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
