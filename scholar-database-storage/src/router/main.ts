import { Hono } from 'hono';
import { StorageRouter } from './storage';
import { SuccessResponse } from '@/util/response';

const MainRouter = new Hono();

MainRouter.get('/', (c) => c.json(...SuccessResponse('HELLO')));

MainRouter.route('/storage', StorageRouter);

export { MainRouter };
