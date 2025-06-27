import { Hono } from 'hono';
import { StorageRouter } from './storage';

const MainRouter = new Hono();

MainRouter.route('/storage', StorageRouter);

export { MainRouter };