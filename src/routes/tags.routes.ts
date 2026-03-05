import { Router, Request, Response } from 'express';
import { TagService } from '../services/tag.service';
import { AnalyticsService } from '../services/analytics.service';
import { EntityType } from '../models/types';

const router = Router();

const getTagService = () => new TagService();
const getAnalyticsService = () => new AnalyticsService();

router.post('/attach', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, tags } = req.body;

    if (!entityType || !entityId || !tags || !Array.isArray(tags)) {
      return res.status(400).json({ 
        error: 'Missing required fields: entityType, entityId, tags' 
      });
    }

    if (!['source', 'snippet', 'aiResponse'].includes(entityType)) {
      return res.status(400).json({ 
        error: 'Invalid entityType. Must be: source, snippet, or aiResponse' 
      });
    }

    const result = await getTagService().attachTags(
      entityType as EntityType,
      entityId,
      tags
    );

    res.json({
      success: true,
      entityType,
      entityId,
      attached: result.attached,
      tags: result.tags.map(tag => ({
        id: tag._id,
        name: tag.name,
        usageCount: tag.usageCount
      }))
    });
  } catch (error) {
    console.error('Error attaching tags:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { days } = req.query;
    
    let daysNum: number | undefined;
    if (days) {
      daysNum = parseInt(days as string, 10);
      if (isNaN(daysNum) || daysNum < 1) {
        return res.status(400).json({ error: 'Invalid days parameter' });
      }
    }

    const analytics = await getAnalyticsService().getTagAnalytics(daysNum);
    res.json(analytics);
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

export default router;
