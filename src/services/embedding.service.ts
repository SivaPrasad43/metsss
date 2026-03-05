import { CohereClientV2 } from 'cohere-ai';
import { config } from '../config';
import { logger } from '../utils/logger';

export class EmbeddingService {
  private client: CohereClientV2;

  constructor() {
    this.client = new CohereClientV2({
      token: config.cohereApiKey,
    });
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      logger.debug(`Generating embeddings for ${texts.length} texts`, { texts });
      
      const response = await this.client.embed({
        texts,
        model: 'embed-v4.0',
        inputType: 'search_document',
        embeddingTypes: ['float'],
      });

      const embeddings = response.embeddings?.float || [];
      logger.debug(`Generated ${embeddings.length} embeddings`, { dimension: embeddings[0]?.length || 0 });
      
      return embeddings;
    } catch (error) {
      logger.error('Error generating embeddings', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text]);
    return embeddings[0] || [];
  }
}

export const embeddingService = new EmbeddingService();
