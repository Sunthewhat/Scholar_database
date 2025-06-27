import { Context } from 'hono';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ErrorResponse, FailedResponse, SuccessResponse } from '@/util/response';

const STORAGE_DIR = process.env.STORAGE_DIR || './uploads';

const StorageController = {
	upload: async (c: Context) => {
		try {
			const formData = await c.req.formData();
			const file = formData.get('file') as File;

			if (!file) {
				return c.json(...FailedResponse('ไม่พบไฟล์'));
			}

			await fs.mkdir(STORAGE_DIR, { recursive: true });

			const fileName = `${Date.now()}-${file.name}`;
			const filePath = join(STORAGE_DIR, fileName);

			const arrayBuffer = await file.arrayBuffer();
			await fs.writeFile(filePath, new Uint8Array(arrayBuffer));

			const fileUrl = `/api/v1/storage/file/${fileName}`;

			return c.json(
				...SuccessResponse('อัปโหลดไฟล์สำเร็จ!', {
					url: fileUrl,
					filename: fileName,
					originalName: file.name,
					size: file.size,
					type: file.type,
				})
			);
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	getFile: async (c: Context) => {
		try {
			const filename = c.req.param('filename');

			if (!filename) {
				return c.json(...FailedResponse('ไม่พบชื่อไฟล์'));
			}

			const filePath = join(STORAGE_DIR, filename);

			try {
				await fs.access(filePath);
			} catch {
				return c.json(...FailedResponse('ไม่พบไฟล์', 404));
			}

			const file = Bun.file(filePath);
			return new Response(file);
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	deleteFile: async (c: Context) => {
		try {
			const filename = c.req.param('filename');

			if (!filename) {
				return c.json(...FailedResponse('ไม่พบชื่อไฟล์'));
			}

			const filePath = join(STORAGE_DIR, filename);

			try {
				await fs.access(filePath);
				await fs.unlink(filePath);
			} catch {
				return c.json(...FailedResponse('ไม่พบไฟล์', 404));
			}

			return c.json(...SuccessResponse('ลบไฟล์สำเร็จ!'));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},
};

export { StorageController };
