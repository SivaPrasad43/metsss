import express, { Request, Response } from 'express';
import { config } from './config';
import { database } from './config/database';
import { createIndexes } from './config/indexes';
import { clearDatabase, seedDatabase } from './services/seed.service';
import { initializeEmbeddings } from './services/init.service';
import tagsRoutes from './routes/tags.routes';
import entitiesRoutes from './routes/entities.routes';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

const app = express();

app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/tags', tagsRoutes);
app.use('/entities', entitiesRoutes);

app.use(errorHandler);

const startServer = async () => {
  try {
    await database.connect();
    await createIndexes();
    
    await clearDatabase();
    await seedDatabase();
    await initializeEmbeddings();
    
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });

    process.on('SIGINT', async () => {
      logger.info('Shutting down gracefully...');
      await database.disconnect();
      process.exit(0);
    });

    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Promise Rejection', reason);
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();

export default app;
