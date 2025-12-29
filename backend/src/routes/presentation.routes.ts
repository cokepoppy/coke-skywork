import { Router } from 'express';
import * as presentationController from '../controllers/presentation.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Create/save a presentation
router.post('/', presentationController.savePresentation);

// Get all presentations for current user
router.get('/', presentationController.getPresentations);

// Get a single presentation by ID
router.get('/:id', presentationController.getPresentation);

// Update a presentation
router.put('/:id', presentationController.updatePresentation);

// Delete a presentation
router.delete('/:id', presentationController.deletePresentation);

export default router;
