import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/metsss',
  cohereApiKey: process.env.COHERE_API_KEY || '',
  semanticSimilarityThreshold: 0.7,
  enableSimilarTagDetection: process.env.ENABLE_SIMILAR_TAG_DETECTION !== 'false',
  similarTagLevenshteinThreshold: parseInt(process.env.SIMILAR_TAG_THRESHOLD || '2', 10),
  popularTagMinUsageCount: parseInt(process.env.POPULAR_TAG_MIN_USAGE || '3', 10),
};
