import { UserController } from '@/controller/user';
import { authMiddleware, adminOnlyMiddleware } from '@/middleware/auth';
import { Hono } from 'hono';

const AuthRouter = new Hono();

// Public route - no middleware
AuthRouter.post('/login', UserController.login);

// Protected routes - require authentication
AuthRouter.post('/admin', authMiddleware, UserController.createAdmin);
AuthRouter.post('/maintainer', authMiddleware, UserController.createMaintainer);
AuthRouter.get('/verify', authMiddleware, UserController.verify);
AuthRouter.put('/change-password', authMiddleware, UserController.changePassword);

// Admin-only routes - require authentication + admin role
AuthRouter.get('/users', authMiddleware, adminOnlyMiddleware, UserController.getAllUsers);
AuthRouter.delete('/users/:id', authMiddleware, adminOnlyMiddleware, UserController.deleteUser);
AuthRouter.patch('/users/:id/role', authMiddleware, adminOnlyMiddleware, UserController.changeUserRole);

export { AuthRouter };
