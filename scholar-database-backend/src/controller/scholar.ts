import { Context } from 'hono';
import { ScholarModel } from '@/model/scholar';
import { ScholarFieldModel } from '@/model/scholarField';
import { StudentModel } from '@/model/student';
import { StorageUtil } from '@/util/storage';
import { scholarPayload } from '@/types/payload';
import { ValidatePayload, ValidatorSchema } from '@/util/zod';
import { ErrorResponse, FailedResponse, SuccessResponse } from '@/util/response';
import * as mongoose from 'mongoose';

// Helper function to validate ObjectId
const isValidObjectId = (id: string): boolean => {
	return mongoose.Types.ObjectId.isValid(id);
};

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
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},

	getAll: async (c: Context) => {
		try {
			const scholars = await ScholarModel.getAll();
			return c.json(...SuccessResponse('ดึงข้อมูลทุนการศึกษาสำเร็จ', scholars));
		} catch (e) {
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},

	getActive: async (c: Context) => {
		try {
			const scholars = await ScholarModel.getActive();
			return c.json(...SuccessResponse('ดึงข้อมูลทุนการศึกษาที่เปิดใช้งานสำเร็จ', scholars));
		} catch (e) {
			console.error(e);

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
			console.error(e);

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
			console.error(e);

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

			return c.json(
				...SuccessResponse('ลบทุนการศึกษาและข้อมูลที่เกี่ยวข้องสำเร็จ!', deletedScholar)
			);
		} catch (e) {
			console.error(e);

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
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},

	generateCSV: async (c: Context) => {
		try {
			const id = c.req.param('id');

			if (!id) return c.json(...FailedResponse('ไม่พบ ID ทุนการศึกษา'));
			if (!isValidObjectId(id))
				return c.json(...FailedResponse('รูปแบบ ID ทุนการศึกษาไม่ถูกต้อง'));

			// Check if scholar exists
			const scholar = await ScholarModel.getById(id);
			if (!scholar) return c.json(...FailedResponse('ไม่พบทุนการศึกษา', 404));

			const { headers, rows } = await StudentModel.generateCSVData(id);
			
			if (headers.length === 0) {
				return c.json(...FailedResponse('ไม่พบข้อมูลนักเรียนในทุนการศึกษานี้'));
			}

			const csvContent = StudentModel.convertToCSVString(headers, rows);
			
			// Create safe filename (remove non-ASCII characters and replace spaces)
			const safeScholarName = scholar.name
				.replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
				.replace(/\s+/g, '_') // Replace spaces with underscores
				.replace(/[^a-zA-Z0-9_-]/g, '') // Remove special characters except underscore and dash
				|| 'scholar'; // Fallback if name becomes empty
			
			const filename = `students_${safeScholarName}_${id}.csv`;
			
			// Set headers for CSV download
			c.header('Content-Type', 'text/csv; charset=utf-8');
			c.header('Content-Disposition', `attachment; filename="${filename}"`);
			
			return c.text(csvContent);
		} catch (e) {
			console.error(e);
			return c.json(...ErrorResponse(e));
		}
	},

	getAnalytics: async (c: Context) => {
		try {
			const id = c.req.param('id');

			if (!id) return c.json(...FailedResponse('ไม่พบ ID ทุนการศึกษา'));
			if (!isValidObjectId(id))
				return c.json(...FailedResponse('รูปแบบ ID ทุนการศึกษาไม่ถูกต้อง'));

			// Check if scholar exists
			const scholar = await ScholarModel.getById(id);
			if (!scholar) return c.json(...FailedResponse('ไม่พบทุนการศึกษา', 404));

			const analytics = await StudentModel.generateAnalytics(id);

			return c.json(...SuccessResponse('ดึงข้อมูลสถิติสำเร็จ', analytics));
		} catch (e) {
			console.error(e);
			return c.json(...ErrorResponse(e));
		}
	},

	uploadDocument: async (c: Context) => {
		try {
			const id = c.req.param('id');

			if (!id) return c.json(...FailedResponse('ไม่พบ ID ทุนการศึกษา'));
			if (!isValidObjectId(id))
				return c.json(...FailedResponse('รูปแบบ ID ทุนการศึกษาไม่ถูกต้อง'));

			const scholar = await ScholarModel.getById(id);
			if (!scholar) return c.json(...FailedResponse('ไม่พบทุนการศึกษา', 404));

			const body = await c.req.parseBody();
			const file = body['document'];
			const fileName = body['file_name'] as string;

			if (!file || !(file instanceof File)) {
				return c.json(...FailedResponse('กรุณาอัปโหลดไฟล์'));
			}

			if (!fileName) {
				return c.json(...FailedResponse('กรุณาระบุชื่อไฟล์'));
			}

			// Upload file
			const uploadedFile = await StorageUtil.uploadFile(file);

			// Create document object
			const document = {
				document_id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				file_name: fileName,
				file_url: uploadedFile.data?.url || '',
				file_type: file.type || 'application/octet-stream',
				uploaded_at: new Date(),
			};

			// Add document to scholar
			const updatedScholar = await ScholarModel.addDocument(id, document);

			if (!updatedScholar) return c.json(...FailedResponse('ไม่พบทุนการศึกษา'));

			return c.json(...SuccessResponse('อัปโหลดไฟล์สำเร็จ!', updatedScholar));
		} catch (e) {
			console.error(e);
			return c.json(...ErrorResponse(e));
		}
	},

	deleteDocument: async (c: Context) => {
		try {
			const id = c.req.param('id');
			const documentId = c.req.param('documentId');

			if (!id) return c.json(...FailedResponse('ไม่พบ ID ทุนการศึกษา'));
			if (!documentId) return c.json(...FailedResponse('ไม่พบ ID เอกสาร'));
			if (!isValidObjectId(id))
				return c.json(...FailedResponse('รูปแบบ ID ทุนการศึกษาไม่ถูกต้อง'));

			const scholar = await ScholarModel.getById(id);
			if (!scholar) return c.json(...FailedResponse('ไม่พบทุนการศึกษา', 404));

			// Find the document
			const document = scholar.documents?.find((doc: any) => doc.document_id === documentId);
			if (!document) return c.json(...FailedResponse('ไม่พบเอกสาร', 404));

			// Delete file from storage
			const filename = StorageUtil.extractFilenameFromUrl(document.file_url);
			if (filename) {
				try {
					await StorageUtil.deleteFile(filename);
				} catch (fileError) {
					console.warn(`Failed to delete file ${filename}:`, fileError);
				}
			}

			// Remove document from scholar
			const updatedScholar = await ScholarModel.deleteDocument(id, documentId);

			if (!updatedScholar) return c.json(...FailedResponse('ไม่พบทุนการศึกษา'));

			return c.json(...SuccessResponse('ลบไฟล์สำเร็จ!', updatedScholar));
		} catch (e) {
			console.error(e);
			return c.json(...ErrorResponse(e));
		}
	},

	getDocuments: async (c: Context) => {
		try {
			const id = c.req.param('id');

			if (!id) return c.json(...FailedResponse('ไม่พบ ID ทุนการศึกษา'));
			if (!isValidObjectId(id))
				return c.json(...FailedResponse('รูปแบบ ID ทุนการศึกษาไม่ถูกต้อง'));

			const scholar = await ScholarModel.getById(id);
			if (!scholar) return c.json(...FailedResponse('ไม่พบทุนการศึกษา', 404));

			const documents = await ScholarModel.getDocuments(id);

			return c.json(...SuccessResponse('ดึงข้อมูลเอกสารสำเร็จ', documents));
		} catch (e) {
			console.error(e);
			return c.json(...ErrorResponse(e));
		}
	},
};

export { ScholarController };
