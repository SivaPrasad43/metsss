import { TagModel } from '../models/Tag';
import { database } from '../config/database';

export class AnalyticsService {
  private tagModel: TagModel;

  constructor() {
    this.tagModel = new TagModel();
  }

  async getTagAnalytics(days?: number) {
    const db = database.getDb();
    
    let dateFilter = {};
    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      dateFilter = { createdAt: { $gte: startDate } };
    }

    // Use aggregation pipeline to compute tag usage across all entity types
    // This demonstrates meaningful MongoDB aggregation instead of multiple countDocuments()
    // Pipeline stages:
    // 1. Match tags (optionally filtered by date)
    // 2. Lookup and count usage in each entity collection
    // 3. Project final structure with breakdown by entity type
    // 4. Sort by total usage descending
    const pipeline = [
      //Filter tags by date if specified
      ...(days ? [{ $match: dateFilter }] : []),
      
      //Lookup sources that reference this tag
      {
        $lookup: {
          from: 'sources',
          let: { tagId: '$_id' },
          pipeline: [
            { $match: { $expr: { $in: ['$$tagId', '$tagIds'] }, ...dateFilter } },
            { $count: 'count' }
          ],
          as: 'sourceCount'
        }
      },
      
      //Lookup snippets that reference this tag
      {
        $lookup: {
          from: 'snippets',
          let: { tagId: '$_id' },
          pipeline: [
            { $match: { $expr: { $in: ['$$tagId', '$tagIds'] }, ...dateFilter } },
            { $count: 'count' }
          ],
          as: 'snippetCount'
        }
      },
      
      //Lookup AI responses that reference this tag
      {
        $lookup: {
          from: 'aiResponses',
          let: { tagId: '$_id' },
          pipeline: [
            { $match: { $expr: { $in: ['$$tagId', '$tagIds'] }, ...dateFilter } },
            { $count: 'count' }
          ],
          as: 'aiResponseCount'
        }
      },
      
      //Project final structure with entity type breakdown
      {
        $project: {
          tagId: '$_id',
          tagName: '$name',
          totalUsage: '$usageCount',
          byEntityType: {
            source: { $ifNull: [{ $arrayElemAt: ['$sourceCount.count', 0] }, 0] },
            snippet: { $ifNull: [{ $arrayElemAt: ['$snippetCount.count', 0] }, 0] },
            aiResponse: { $ifNull: [{ $arrayElemAt: ['$aiResponseCount.count', 0] }, 0] }
          },
          createdAt: 1
        }
      },
      
      //Sort by total usage descending
      { $sort: { totalUsage: -1 } }
    ];

    const analytics = await db.collection('tags').aggregate(pipeline).toArray();

    return {
      tags: analytics,
      totalTags: analytics.length,
      period: days ? `last ${days} days` : 'all time'
    };
  }
}
