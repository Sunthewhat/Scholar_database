import { Context } from 'hono';

export const parseFormDataPayload = async (c: Context): Promise<{
	formData: FormData;
	jsonData: Record<string, any>;
}> => {
	const contentType = c.req.header('content-type') || '';
	console.log('parseFormDataPayload - Content-Type:', contentType);
	
	if (contentType.includes('multipart/form-data')) {
		console.log('Parsing multipart/form-data...');
		const formData = await c.req.formData();
		const jsonData: Record<string, any> = {};
		
		console.log('FormData entries:');
		for (const [key, value] of formData.entries()) {
			console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size} bytes)` : value);
			if (!(value instanceof File)) {
				try {
					jsonData[key] = JSON.parse(value as string);
				} catch {
					jsonData[key] = value;
				}
			}
		}
		
		console.log('Parsed JSON data:', jsonData);
		return { formData, jsonData };
	} else {
		console.log('Parsing JSON...');
		const jsonData = await c.req.json();
		const formData = new FormData();
		
		return { formData, jsonData };
	}
};