import { Router, Request, Response } from 'express';
import { SearchService } from '../services/search.service';
import { EntityType } from '../models/types';

const router = Router();

const getSearchService = () => new SearchService();

router.get('/search', async (req: Request, res: Response) => {
  try {
    const { entityType, tags, mode = 'or', page = '1', limit = '20' } = req.query;

    if (!tags) {
      return res.status(400).json({ error: 'Missing required parameter: tags' });
    }

    const tagArray = typeof tags === 'string' ? tags.split(',') : [];
    
    if (tagArray.length === 0) {
      return res.status(400).json({ error: 'No valid tags provided' });
    }

    if (mode !== 'and' && mode !== 'or') {
      return res.status(400).json({ error: 'Invalid mode. Must be: and or or' });
    }

    if (entityType && !['source', 'snippet', 'aiResponse'].includes(entityType as string)) {
      return res.status(400).json({ 
        error: 'Invalid entityType. Must be: source, snippet, or aiResponse' 
      });
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Invalid page number' });
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Invalid limit (must be 1-100)' });
    }

    const result = await getSearchService().searchEntities({
      entityType: entityType as EntityType | undefined,
      tags: tagArray,
      mode: mode as 'and' | 'or',
      page: pageNum,
      limit: limitNum
    });

    res.json(result);
  } catch (error) {
    console.error('Error searching entities:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

export default router;
