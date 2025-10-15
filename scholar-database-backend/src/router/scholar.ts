import { ScholarController } from '@/controller/scholar';
import { authMiddleware } from '@/middleware/auth';
import { Hono } from 'hono';

const ScholarRouter = new Hono();

// All scholar routes require authentication
ScholarRouter.use('*', authMiddleware);

// GET /scholar - Get all scholars
ScholarRouter.get('/', ScholarController.getAll);

// GET /scholar/active - Get active scholars
ScholarRouter.get('/active', ScholarController.getActive);

// GET /scholar/csv/:id - Generate CSV export for students by scholar ID
ScholarRouter.get('/csv/:id', ScholarController.generateCSV);

// GET /scholar/analytics/:id - Get analytics for students by scholar ID
ScholarRouter.get('/analytics/:id', ScholarController.getAnalytics);

// GET /scholar/:id - Get scholar by ID
ScholarRouter.get('/:id', ScholarController.getById);

// POST /scholar - Create new scholar
ScholarRouter.post('/', ScholarController.create);

// PUT /scholar/:id - Update scholar
ScholarRouter.put('/:id', ScholarController.update);

// DELETE /scholar/:id - Delete scholar
ScholarRouter.delete('/:id', ScholarController.delete);

// PATCH /scholar/:id/status/:status - Set scholar status (active/inactive)
ScholarRouter.patch('/:id/status/:status', ScholarController.setStatus);

// GET /scholar/:id/documents - Get all documents for a scholar
ScholarRouter.get('/:id/documents', ScholarController.getDocuments);

// POST /scholar/:id/documents - Upload a document for a scholar
ScholarRouter.post('/:id/documents', ScholarController.uploadDocument);

// DELETE /scholar/:id/documents/:documentId - Delete a document from a scholar
ScholarRouter.delete('/:id/documents/:documentId', ScholarController.deleteDocument);

export { ScholarRouter };
