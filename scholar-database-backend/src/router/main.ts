import { Hono } from 'hono';
import { AuthRouter } from './auth';
import { ScholarRouter } from './scholar';
import { ScholarFieldRouter } from './scholarField';
import { StudentRouter } from './student';

const MainRouter = new Hono();

MainRouter.route('/auth', AuthRouter);
MainRouter.route('/scholar', ScholarRouter);
MainRouter.route('/scholar-field', ScholarFieldRouter);
MainRouter.route('/student', StudentRouter);

export { MainRouter };
