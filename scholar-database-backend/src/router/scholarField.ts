import { ScholarFieldController } from '@/controller/scholarField';
import { authMiddleware } from '@/middleware/auth';
import { Hono } from 'hono';

const ScholarFieldRouter = new Hono();

// All scholar field routes require authentication
ScholarFieldRouter.use('*', authMiddleware);

// GET /scholar-field/scholar/:scholarId - Get all fields for a scholar
ScholarFieldRouter.get('/scholar/:scholarId', ScholarFieldController.getByScholarId);

// GET /scholar-field/:id - Get field by ID
ScholarFieldRouter.get('/:id', ScholarFieldController.getById);

// POST /scholar-field - Create new field
ScholarFieldRouter.post('/', ScholarFieldController.create);

// PUT /scholar-field/:id - Update field
ScholarFieldRouter.put('/:id', ScholarFieldController.update);

// DELETE /scholar-field/:id - Delete field
ScholarFieldRouter.delete('/:id', ScholarFieldController.delete);

// POST /scholar-field/reorder - Reorder fields
ScholarFieldRouter.post('/reorder', ScholarFieldController.reorderFields);

// POST /scholar-field/:fieldId/question - Add question to field
ScholarFieldRouter.post('/:fieldId/question', ScholarFieldController.addQuestion);

// PUT /scholar-field/:fieldId/question/:questionId - Update question
ScholarFieldRouter.put('/:fieldId/question/:questionId', ScholarFieldController.updateQuestion);

// DELETE /scholar-field/:fieldId/question/:questionId - Remove question
ScholarFieldRouter.delete('/:fieldId/question/:questionId', ScholarFieldController.removeQuestion);

// POST /scholar-field/question/reorder - Reorder questions
ScholarFieldRouter.post('/question/reorder', ScholarFieldController.reorderQuestions);

export { ScholarFieldRouter };