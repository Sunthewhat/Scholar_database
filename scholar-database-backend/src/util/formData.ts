import { Context } from 'hono';
import { isFile } from './storage';

export const parseFormDataPayload = async (
	c: Context
): Promise<{
	formData: FormData;
	jsonData: Record<string, any>;
}> => {
	const contentType = c.req.header('content-type') || '';

	if (contentType.includes('multipart/form-data')) {
		const formData = await c.req.formData();
		const jsonData: Record<string, any> = {};

		for (const [key, value] of formData.entries()) {
			if (!isFile(value)) {
				try {
					jsonData[key] = JSON.parse(value as string);
				} catch {
					jsonData[key] = value;
				}
			}
		}

		return { formData, jsonData };
	} else {
		const jsonData = await c.req.json();
		const formData = new FormData();

		return { formData, jsonData };
	}
};
