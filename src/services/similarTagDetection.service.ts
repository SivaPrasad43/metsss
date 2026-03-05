import { Tag } from '../models/types';
import { levenshteinDistance } from '../utils/levenshtein';
import { config } from '../config';
import { logger } from '../utils/logger';

export class SimilarTagDetectionService {
  findSimilarTag(tagName: string, popularTags: Tag[]): Tag | null {
    logger.debug(`Checking similarity for tag: "${tagName}" against ${popularTags.length} popular tags`);
    
    for (const popularTag of popularTags) {
      const distance = levenshteinDistance(tagName, popularTag.name);
      
      if (distance <= config.similarTagLevenshteinThreshold && distance > 0) {
        logger.info(`Similar tag found: "${tagName}" → "${popularTag.name}" (distance: ${distance}, threshold: ${config.similarTagLevenshteinThreshold})`);
        return popularTag;
      }
      
      if (distance > 0 && distance <= config.similarTagLevenshteinThreshold + 1) {
        logger.debug(`Close match: "${tagName}" vs "${popularTag.name}" (distance: ${distance})`);
      }
    }
    
    logger.debug(`No similar tag found for: "${tagName}"`);
    return null;
  }
}
