import { Hono } from 'hono';
import { StudentController } from '@/controller/student';
import { authMiddleware } from '@/middleware/auth';

const StudentRouter = new Hono();

// POST /student/temp-permission/verify - Verify temporary permission token
StudentRouter.post('/temp-permission/verify', StudentController.verifyTempPermission);

// Apply authentication middleware to all student routes
StudentRouter.use('*', authMiddleware);

// GET /student - Get all students
StudentRouter.get('/', StudentController.getAll);

// GET /student/scholar/:scholarId - Get students by scholar ID (must come before /:id)
StudentRouter.get('/scholar/:scholarId', StudentController.getByScholar);

// GET /student/scholar/:scholarId/count - Get student count by scholar ID
StudentRouter.get('/scholar/:scholarId/count', StudentController.getCountByScholar);

// GET /student/status/:status - Get students by status (must come before /:id)
StudentRouter.get('/status/:status', StudentController.getByStatus);

// GET /student/search - Search all students
StudentRouter.get('/search', StudentController.searchAll);

// GET /student/search/:scholarId - Search students by scholar ID
StudentRouter.get('/search/:scholarId', StudentController.searchByScholar);

// GET /student/:id - Get student by ID (must come after specific routes)
StudentRouter.get('/:id', StudentController.getById);

// POST /student - Create new student
StudentRouter.post('/', StudentController.create);

// PUT /student/:id - Update student
StudentRouter.put('/:id', StudentController.update);

// DELETE /student/:id - Delete student
StudentRouter.delete('/:id', StudentController.delete);

// PATCH /student/:id/status/:status - Update student status
StudentRouter.patch('/:id/status/:status', StudentController.setStatus);

// POST /student/:id/submit - Submit student form
StudentRouter.post('/:id/submit', StudentController.submitForm);

// POST /student/temp-permission/generate - Generate temporary permission token for student
StudentRouter.post('/temp-permission/generate', StudentController.generateTempPermission);

export { StudentRouter };
