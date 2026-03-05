import { TagModel } from '../models/Tag';
import { embeddingService } from './embedding.service';
import { config } from '../config';
import { logger } from '../utils/logger';

export const initializeEmbeddings = async (): Promise<void> => {
  if (!config.cohereApiKey) {
    logger.warn('Skipping embedding generation: COHERE_API_KEY not set');
    return;
  }

  try {
    const tagModel = new TagModel();
    const tags = await tagModel.findAll();
    const tagsWithoutEmbeddings = tags.filter(tag => !tag.embedding);

    if (tagsWithoutEmbeddings.length === 0) {
      logger.info('All tags already have embeddings');
      return;
    }

    logger.info(`Generating embeddings for ${tagsWithoutEmbeddings.length} tags...`);

    const batchSize = 96;
    for (let i = 0; i < tagsWithoutEmbeddings.length; i += batchSize) {
      const batch = tagsWithoutEmbeddings.slice(i, i + batchSize);
      const tagNames = batch.map(tag => tag.name);
      
      const embeddings = await embeddingService.generateEmbeddings(tagNames);

      for (let j = 0; j < batch.length; j++) {
        if (batch[j]._id) {
          await tagModel.updateEmbedding(batch[j]._id!, embeddings[j]);
        }
      }

      logger.info(`Processed ${Math.min(i + batchSize, tagsWithoutEmbeddings.length)}/${tagsWithoutEmbeddings.length} tags`);
    }

    logger.info('Embedding generation complete');
  } catch (error) {
    logger.error('Error initializing embeddings', error);
  }
};
