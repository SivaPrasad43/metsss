import { TagModel } from '../models/Tag';
import { Tag } from '../models/types';
import { cosineSimilarity } from '../utils/similarity';
import { config } from '../config';
import { logger } from '../utils/logger';

export class SimilarityService {
  private tagModel: TagModel;
  private similarityCache: Map<string, { tagId: string; similarity: number }[]>;

  constructor() {
    this.tagModel = new TagModel();
    this.similarityCache = new Map();
  }

  async findSimilarTags(tagNames: string[]): Promise<Tag[]> {
    const tags = await this.tagModel.findByNames(tagNames);
    const tagsWithEmbeddings = tags.filter(tag => tag.embedding && tag.embedding.length > 0);

    if (tagsWithEmbeddings.length === 0) {
      return tags;
    }

    const allTags = await this.tagModel.findAll();
    const similarTagIds = new Set<string>();

    // Add original tags
    tags.forEach(tag => {
      if (tag._id) similarTagIds.add(tag._id.toString());
    });

    // Find similar tags - cosine similarity computation
    for (const searchTag of tagsWithEmbeddings) {
      const cacheKey = searchTag._id!.toString();
      
      let similarTags = this.similarityCache.get(cacheKey);
      
      if (!similarTags) {
        similarTags = [];
        
        logger.debug(`Computing similarities for "${searchTag.name}"`);
        let maxSimilarity = 0;
        let maxTag = '';
        
        for (const candidateTag of allTags) {
          if (
            candidateTag._id?.toString() === searchTag._id?.toString() ||
            !candidateTag.embedding ||
            candidateTag.embedding.length === 0
          ) {
            continue;
          }

          const similarity = cosineSimilarity(searchTag.embedding!, candidateTag.embedding);
          
          // Track max for debugging
          if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            maxTag = candidateTag.name;
          }
          
          if (similarity >= config.semanticSimilarityThreshold) {
            similarTags.push({
              tagId: candidateTag._id!.toString(),
              similarity
            });
          }
        }

        logger.debug(`Max similarity for "${searchTag.name}": ${maxSimilarity.toFixed(4)} with "${maxTag}"`);
        
        similarTags.sort((a, b) => b.similarity - a.similarity);
        this.similarityCache.set(cacheKey, similarTags);
        
        logger.info(`Semantic expansion for "${searchTag.name}": ${similarTags.length} similar tags found (threshold: ${config.semanticSimilarityThreshold})`);
        if (similarTags.length > 0) {
          const topSimilar = similarTags.slice(0, 5).map(t => {
            const tag = allTags.find(tag => tag._id?.toString() === t.tagId);
            return `${tag?.name} (${t.similarity.toFixed(3)})`;
          });
          logger.debug(`Top similar tags: ${topSimilar.join(', ')}`);
        }
      }

      similarTags.forEach(item => similarTagIds.add(item.tagId));
    }

    const expandedTags = allTags.filter(tag => 
      tag._id && similarTagIds.has(tag._id.toString())
    );

    return expandedTags;
  }

  clearCache(): void {
    this.similarityCache.clear();
  }
}
