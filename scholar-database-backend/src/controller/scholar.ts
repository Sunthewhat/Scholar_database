import { Context } from 'hono';
import { ScholarModel } from '@/model/scholar';
import { ScholarFieldModel } from '@/model/scholarField';
import { StudentModel } from '@/model/student';
import { StorageUtil } from '@/util/storage';
import { scholarPayload } from '@/types/payload';
import { ValidatePayload, ValidatorSchema } from '@/util/zod';
import { ErrorResponse, FailedResponse, SuccessResponse } from '@/util/response';

const ScholarController = {
	create: async (c: Context) => {
		try {
			const payload = await ValidatePayload<scholarPayload.Create>(
				c,
				ValidatorSchema.ScholarPayload.create
			);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			const newScholar = await ScholarModel.create(payload.data);

			return c.json(...SuccessResponse('สร้างทุนการศึกษาสำเร็จ!', newScholar));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	getAll: async (c: Context) => {
		try {
			const scholars = await ScholarModel.getAll();
			return c.json(...SuccessResponse('ดึงข้อมูลทุนการศึกษาสำเร็จ', scholars));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	getActive: async (c: Context) => {
		try {
			const scholars = await ScholarModel.getActive();
			return c.json(...SuccessResponse('ดึงข้อมูลทุนการศึกษาที่เปิดใช้งานสำเร็จ', scholars));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	getById: async (c: Context) => {
		try {
			const id = c.req.param('id');

			if (!id) return c.json(...FailedResponse('ไม่พบ ID ทุนการศึกษา'));

			const scholar = await ScholarModel.getById(id);

			if (!scholar) return c.json(...FailedResponse('ไม่พบทุนการศึกษา', 404));

			return c.json(...SuccessResponse('ดึงข้อมูลทุนการศึกษาสำเร็จ', scholar));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	update: async (c: Context) => {
		try {
			const id = c.req.param('id');

			if (!id) return c.json(...FailedResponse('ไม่พบ ID ทุนการศึกษา'));

			const payload = await ValidatePayload<scholarPayload.Update>(
				c,
				ValidatorSchema.ScholarPayload.update
			);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			const updatedScholar = await ScholarModel.update(id, payload.data);

			if (!updatedScholar) return c.json(...FailedResponse('ไม่พบทุนการศึกษา', 404));

			return c.json(...SuccessResponse('อัปเดตทุนการศึกษาสำเร็จ!', updatedScholar));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	delete: async (c: Context) => {
		try {
			const id = c.req.param('id');

			if (!id) return c.json(...FailedResponse('ไม่พบ ID ทุนการศึกษา'));

			// Check if scholar exists
			const scholar = await ScholarModel.getById(id);
			if (!scholar) return c.json(...FailedResponse('ไม่พบทุนการศึกษา', 404));

			// Get all students for this scholar to clean up their files
			const students = await StudentModel.getByScholar(id);
			
			// Clean up student files
			for (const student of students) {
				if (student.form_data) {
					const fileUrls = StorageUtil.extractFileUrls(student.form_data);
					for (const url of fileUrls) {
						const filename = StorageUtil.extractFilenameFromUrl(url);
						if (filename) {
							try {
								await StorageUtil.deleteFile(filename);
							} catch (fileError) {
								console.warn(`Failed to delete file ${filename}:`, fileError);
							}
						}
					}
				}
			}

			// Delete all related students
			await StudentModel.deleteByScholar(id);

			// Delete all related scholar fields
			await ScholarFieldModel.deleteByScholarId(id);

			// Finally delete the scholar
			const deletedScholar = await ScholarModel.delete(id);

			return c.json(...SuccessResponse('ลบทุนการศึกษาและข้อมูลที่เกี่ยวข้องสำเร็จ!', deletedScholar));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	setStatus: async (c: Context) => {
		try {
			const id = c.req.param('id');
			const status = c.req.param('status') as 'active' | 'inactive';

			if (!id) return c.json(...FailedResponse('ไม่พบ ID ทุนการศึกษา'));

			if (!['active', 'inactive'].includes(status)) {
				return c.json(...FailedResponse('สถานะไม่ถูกต้อง'));
			}

			const updatedScholar = await ScholarModel.setStatus(id, status);

			if (!updatedScholar) return c.json(...FailedResponse('ไม่พบทุนการศึกษา', 404));

			const statusText = status === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
			return c.json(...SuccessResponse(`${statusText}ทุนการศึกษาสำเร็จ!`, updatedScholar));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},
};

export { ScholarController };
