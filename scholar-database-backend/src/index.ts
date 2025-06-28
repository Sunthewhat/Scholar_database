import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { InitMongo } from './db/mongoose';
import { MainRouter } from './router/main';
import { AuthMiddlewareSetValue } from './types/middleware';

const mongo = await InitMongo();

fetch(Bun.env.STORAGE_URL).then((r) => {
	if (r.status !== 200) throw new Error('Cannot connect to STORAGE');
	console.log('Storage unit connected');
});

const ORIGIN = Bun.env.ORIGIN || '';

if (!ORIGIN) console.error('No Environment Origin found');

type Variables = {
	user: AuthMiddlewareSetValue;
};

const app = new Hono<{ Variables: Variables }>().basePath('api');

const DEVELOPMENT = Bun.env.DEVELOPMENT;

if (DEVELOPMENT !== 'PROD') {
	app.use(logger());
}

app.use(
	cors({
		origin: [ORIGIN],
	})
);

export { mongo };

app.route('v1', MainRouter);

export default {
	fetch: app.fetch,
	port: 8000,
};
