import { Request, Response } from 'express';
import { prisma } from '../config/database';
import logger from '../config/logger';

/**
 * Save a presentation to database
 */
export async function savePresentation(req: Request, res: Response) {
  try {
    logger.info(`[Presentation] Save request received. User object:`, req.user);
    const userId = req.user?.userId;
    if (!userId) {
      logger.error(`[Presentation] No userId found in request. req.user:`, req.user);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let { topic, theme, generatedImage, htmlContent, thumbnailData, analyzedData, metadata, slides } = req.body;

    if (!topic || !theme) {
      return res.status(400).json({ error: 'Topic and theme are required' });
    }

    // Safety: Truncate topic if it's too long (database limit is 500 chars)
    if (topic.length > 500) {
      logger.warn(`[Presentation] Topic too long (${topic.length} chars), truncating to 500`);
      topic = topic.substring(0, 497) + '...';
    }

    logger.info(`[Presentation] Saving presentation for user ${userId}. Topic length: ${topic.length}, Topic: ${topic.substring(0, 100)}...`);
    logger.info(`[Presentation] Data received:`, {
      hasGeneratedImage: !!generatedImage,
      generatedImageLength: generatedImage?.length,
      hasHtmlContent: !!htmlContent,
      htmlContentLength: htmlContent?.length,
      hasSlides: !!slides,
      slidesCount: slides?.length,
      firstSlideHtmlLength: slides?.[0]?.htmlContent?.length
    });

    const presentation = await prisma.presentation.create({
      data: {
        userId,
        topic,
        theme,
        generatedImage,
        htmlContent,
        thumbnailData,
        analyzedData: analyzedData ? JSON.parse(JSON.stringify(analyzedData)) : null,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      },
    });

    logger.info(`[Presentation] Saved presentation: ${presentation.id}`);

    res.json({
      success: true,
      presentation: {
        id: presentation.id,
        topic: presentation.topic,
        theme: presentation.theme,
        createdAt: presentation.createdAt,
        lastModified: presentation.lastModified,
      }
    });
  } catch (error: any) {
    logger.error('[Presentation] Save error:', error);
    res.status(500).json({ error: 'Failed to save presentation', details: error.message });
  }
}

/**
 * Get all presentations for current user
 */
export async function getPresentations(req: Request, res: Response) {
  try {
    logger.info(`[Presentation] Get all request received. User object:`, req.user);
    const userId = req.user?.userId;
    if (!userId) {
      logger.error(`[Presentation] No userId found in request. req.user:`, req.user);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    logger.info(`[Presentation] Getting presentations for user ${userId} (limit: ${limit}, offset: ${offset})`);

    const presentations = await prisma.presentation.findMany({
      where: { userId },
      orderBy: { lastModified: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        topic: true,
        theme: true,
        thumbnailData: true,
        createdAt: true,
        lastModified: true,
        // Don't return large fields in list view
        generatedImage: false,
        htmlContent: false,
        analyzedData: false,
      },
    });

    logger.info(`[Presentation] Found ${presentations.length} presentations`);

    res.json({
      success: true,
      presentations,
      total: presentations.length,
    });
  } catch (error: any) {
    logger.error('[Presentation] Get presentations error:', error);
    res.status(500).json({ error: 'Failed to load presentations', details: error.message });
  }
}

/**
 * Get a single presentation by ID
 */
export async function getPresentation(req: Request, res: Response) {
  try {
    logger.info(`[Presentation] Get by ID request received. User object:`, req.user);
    const userId = req.user?.userId;
    if (!userId) {
      logger.error(`[Presentation] No userId found in request. req.user:`, req.user);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    logger.info(`[Presentation] Getting presentation ${id} for user ${userId}`);

    const presentation = await prisma.presentation.findFirst({
      where: {
        id,
        userId, // Ensure user can only access their own presentations
      },
    });

    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    logger.info(`[Presentation] Found presentation: ${presentation.topic}`);

    res.json({
      success: true,
      presentation: {
        id: presentation.id,
        topic: presentation.topic,
        theme: presentation.theme,
        generatedImage: presentation.generatedImage,
        htmlContent: presentation.htmlContent,
        thumbnailData: presentation.thumbnailData,
        analyzedData: presentation.analyzedData,
        metadata: presentation.metadata,
        createdAt: presentation.createdAt,
        lastModified: presentation.lastModified,
      },
    });
  } catch (error: any) {
    logger.error('[Presentation] Get presentation error:', error);
    res.status(500).json({ error: 'Failed to load presentation', details: error.message });
  }
}

/**
 * Update a presentation
 */
export async function updatePresentation(req: Request, res: Response) {
  try {
    logger.info(`[Presentation] Update request received. User object:`, req.user);
    const userId = req.user?.userId;
    if (!userId) {
      logger.error(`[Presentation] No userId found in request. req.user:`, req.user);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { topic, theme, generatedImage, htmlContent, thumbnailData, analyzedData, metadata } = req.body;

    logger.info(`[Presentation] Updating presentation ${id} for user ${userId}`);

    // Check ownership
    const existing = await prisma.presentation.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    const presentation = await prisma.presentation.update({
      where: { id },
      data: {
        topic: topic || existing.topic,
        theme: theme || existing.theme,
        generatedImage: generatedImage !== undefined ? generatedImage : existing.generatedImage,
        htmlContent: htmlContent !== undefined ? htmlContent : existing.htmlContent,
        thumbnailData: thumbnailData !== undefined ? thumbnailData : existing.thumbnailData,
        analyzedData: analyzedData ? JSON.parse(JSON.stringify(analyzedData)) : existing.analyzedData,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : existing.metadata,
      },
    });

    logger.info(`[Presentation] Updated presentation: ${presentation.id}`);

    res.json({
      success: true,
      presentation: {
        id: presentation.id,
        topic: presentation.topic,
        lastModified: presentation.lastModified,
      },
    });
  } catch (error: any) {
    logger.error('[Presentation] Update error:', error);
    res.status(500).json({ error: 'Failed to update presentation', details: error.message });
  }
}

/**
 * Delete a presentation
 */
export async function deletePresentation(req: Request, res: Response) {
  try {
    logger.info(`[Presentation] Delete request received. User object:`, req.user);
    const userId = req.user?.userId;
    if (!userId) {
      logger.error(`[Presentation] No userId found in request. req.user:`, req.user);
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    logger.info(`[Presentation] Deleting presentation ${id} for user ${userId}`);

    // Check ownership before deleting
    const existing = await prisma.presentation.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    await prisma.presentation.delete({
      where: { id },
    });

    logger.info(`[Presentation] Deleted presentation: ${id}`);

    res.json({
      success: true,
      message: 'Presentation deleted successfully',
    });
  } catch (error: any) {
    logger.error('[Presentation] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete presentation', details: error.message });
  }
}
