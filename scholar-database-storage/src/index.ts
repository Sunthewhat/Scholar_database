import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { MainRouter } from './router/main';

const ORIGIN = Bun.env.ORIGIN || '';

if (!ORIGIN) console.error('No Environment Origin found');

const app = new Hono().basePath('api');

const DEVELOPMENT = Bun.env.DEVELOPMENT;

if (DEVELOPMENT !== 'PROD') {
	app.use(logger());
}

app.use(
	cors({
		origin: [ORIGIN],
	})
);

app.route('v1', MainRouter);

export default {
	fetch: app.fetch,
	port: 9000,
};
