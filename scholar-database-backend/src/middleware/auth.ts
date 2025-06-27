import { Context, Next } from 'hono';
import * as jwt from 'hono/jwt';
import { UserModel } from '@/model/user';
import { FailedResponse, ErrorResponse } from '@/util/response';
import { AuthMiddlewareSetValue } from '@/types/middleware';

export const authMiddleware = async (c: Context, next: Next) => {
	try {
		const authHeader = c.req.header('Authorization');

		if (!authHeader) {
			return c.json(...FailedResponse('ไม่พบ Authorization header'));
		}

		if (!authHeader.startsWith('Bearer ')) {
			return c.json(...FailedResponse('รูปแบบ Authorization header ไม่ถูกต้อง'));
		}

		const token = authHeader.substring(7);
		const jwt_secret = Bun.env.JWT_SECRET;

		if (!jwt_secret) throw new Error('JWT_SECRET is not defined');

		const decoded = (await jwt.verify(token, jwt_secret)) as { id: string };

		if (!decoded.id) {
			return c.json(...FailedResponse('Token ไม่ถูกต้อง'));
		}

		const user = await UserModel.getById(decoded.id);

		if (!user) {
			return c.json(...FailedResponse('ไม่พบผู้ใช้งาน'));
		}

		c.set('user', {
			id: user.id,
			username: user.username,
			firstname: user.firstname,
			lastname: user.lastname,
			role: user.role,
			is_first_time: user.is_first_time,
		} as AuthMiddlewareSetValue);

		await next();
	} catch (e) {
		return c.json(...ErrorResponse(e));
	}
};

export const adminOnlyMiddleware = async (c: Context, next: Next) => {
	const user: AuthMiddlewareSetValue | null | undefined = c.get('user');
	if (!user) {
		return c.json(...FailedResponse('ไม่พบข้อมูลผู้ใช้งาน'));
	}

	if (user.role !== 'admin') {
		return c.json(...FailedResponse('ไม่มีสิทธิ์เข้าถึงข้อมูลนี้'));
	}

	await next();
};
