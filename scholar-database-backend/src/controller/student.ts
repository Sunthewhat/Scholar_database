import { Context } from 'hono';
import { StudentModel } from '@/model/student';
import { studentPayload } from '@/types/payload';
import { ValidatePayload, ValidatorSchema } from '@/util/zod';
import { ErrorResponse, FailedResponse, SuccessResponse } from '@/util/response';
import { StorageUtil } from '@/util/storage';
import { parseFormDataPayload } from '@/util/formData';
import * as mongoose from 'mongoose';

// Helper function to validate ObjectId
const isValidObjectId = (id: string): boolean => {
	return mongoose.Types.ObjectId.isValid(id);
};

const extractFullname = (formData: Record<string, any>): string => {
	let name = '';
	let surname = '';
	let isFoundName = false;
	let isFoundSurname = false;

	for (const [_, value] of Object.entries(formData)) {
		if (isFoundName && isFoundSurname) break;
		for (const [k, v] of Object.entries(value)) {
			if (isFoundName && isFoundSurname) break;
			if (
				k.toLowerCase().includes('name') &&
				!k.toLowerCase().includes('surname') &&
				!isFoundName
			) {
				name = String(v || '');
				isFoundName = true;
			}
			if (k.toLowerCase().includes('surname') && !isFoundSurname) {
				surname = String(v || '');
				isFoundSurname = true;
			}
		}
	}

	return `${name} ${surname}`.trim();
};

const StudentController = {
	create: async (c: Context) => {
		try {
			const { formData, jsonData } = await parseFormDataPayload(c);
			
			const payload = await ValidatePayload<studentPayload.Create>(
				{ req: { json: () => jsonData } } as Context,
				ValidatorSchema.StudentPayload.create
			);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			let processedFormData = payload.data.form_data || {};
			
			if (formData.entries().next().value) {
				try {
					const fileData = await StorageUtil.processFormDataFiles(formData);
					processedFormData = { ...processedFormData, ...fileData };
				} catch (storageError) {
					return c.json(...ErrorResponse(storageError));
				}
			}

			const fullname = extractFullname(processedFormData);

			const newStudent = await StudentModel.create({
				scholar_id: new mongoose.Types.ObjectId(payload.data.scholar_id),
				form_data: processedFormData,
				fullname: fullname || undefined,
			});

			return c.json(...SuccessResponse('สร้างนักเรียนสำเร็จ!', newStudent));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	getAll: async (c: Context) => {
		try {
			const students = await StudentModel.getAll();
			return c.json(...SuccessResponse('ดึงข้อมูลนักเรียนสำเร็จ', students));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	getById: async (c: Context) => {
		try {
			const id = c.req.param('id');

			if (!id) return c.json(...FailedResponse('ไม่พบ ID นักเรียน'));
			if (!isValidObjectId(id))
				return c.json(...FailedResponse('รูปแบบ ID นักเรียนไม่ถูกต้อง'));

			const student = await StudentModel.getById(id);

			if (!student) return c.json(...FailedResponse('ไม่พบนักเรียน'));

			return c.json(...SuccessResponse('ดึงข้อมูลนักเรียนสำเร็จ', student));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	getByScholar: async (c: Context) => {
		try {
			const scholarId = c.req.param('scholarId');

			if (!scholarId) return c.json(...FailedResponse('ไม่พบ ID ทุนการศึกษา'));
			if (!isValidObjectId(scholarId))
				return c.json(...FailedResponse('รูปแบบ ID ทุนการศึกษาไม่ถูกต้อง'));

			const students = await StudentModel.getByScholar(scholarId);

			return c.json(...SuccessResponse('ดึงข้อมูลนักเรียนสำเร็จ', students));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	getByStatus: async (c: Context) => {
		try {
			const status = c.req.param('status') as
				| 'created'
				| 'draft'
				| 'submitted'
				| 'approved'
				| 'rejected';

			if (!['created', 'draft', 'submitted', 'approved', 'rejected'].includes(status)) {
				return c.json(...FailedResponse('สถานะไม่ถูกต้อง'));
			}

			const students = await StudentModel.getByStatus(status);

			return c.json(...SuccessResponse('ดึงข้อมูลนักเรียนสำเร็จ', students));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	update: async (c: Context) => {
		try {
			const id = c.req.param('id');
			console.log('Student update request for ID:', id);

			if (!id) return c.json(...FailedResponse('ไม่พบ ID นักเรียน'));
			if (!isValidObjectId(id))
				return c.json(...FailedResponse('รูปแบบ ID นักเรียนไม่ถูกต้อง'));

			const { formData, jsonData } = await parseFormDataPayload(c);

			const payload = await ValidatePayload<studentPayload.Update>(
				{ req: { json: () => jsonData } } as Context,
				ValidatorSchema.StudentPayload.update
			);

			if (!payload.success) {
				console.log('Validation failed:', payload.error);
				return c.json(...FailedResponse(payload.error));
			}

			let updateData = { ...payload.data };
			
			if (payload.data.form_data) {
				const existingStudent = await StudentModel.getById(id);
				if (!existingStudent) return c.json(...FailedResponse('ไม่พบนักเรียน'));

				let processedFormData = payload.data.form_data;

				const hasFormDataFiles = formData.entries().next().value;
				console.log('Has FormData files:', !!hasFormDataFiles);

				if (hasFormDataFiles) {
					console.log('Processing files from FormData...');
					try {
						const fileData = await StorageUtil.processFormDataFiles(formData);
						console.log('File processing result:', fileData);
						processedFormData = { ...processedFormData, ...fileData };
						
						await StorageUtil.cleanupOldFiles(existingStudent.form_data, processedFormData);
					} catch (storageError) {
						console.error('Storage error:', storageError);
						return c.json(...ErrorResponse(storageError));
					}
				}

				updateData.form_data = processedFormData;

				const fullname = extractFullname(processedFormData);
				if (fullname) {
					updateData.fullname = fullname;
				}
			}

			const updatedStudent = await StudentModel.update(id, updateData);

			if (!updatedStudent) return c.json(...FailedResponse('ไม่พบนักเรียน'));

			return c.json(...SuccessResponse('อัปเดตข้อมูลนักเรียนสำเร็จ!', updatedStudent));
		} catch (e) {
			console.error('Update error:', e);
			return c.json(...ErrorResponse(e));
		}
	},

	delete: async (c: Context) => {
		try {
			const id = c.req.param('id');

			if (!id) return c.json(...FailedResponse('ไม่พบ ID นักเรียน'));
			if (!isValidObjectId(id))
				return c.json(...FailedResponse('รูปแบบ ID นักเรียนไม่ถูกต้อง'));

			const existingStudent = await StudentModel.getById(id);
			if (!existingStudent) return c.json(...FailedResponse('ไม่พบนักเรียน'));

			const fileUrls = StorageUtil.extractFileUrls(existingStudent.form_data);
			for (const url of fileUrls) {
				const filename = StorageUtil.extractFilenameFromUrl(url);
				if (filename) {
					await StorageUtil.deleteFile(filename);
				}
			}

			const deletedStudent = await StudentModel.delete(id);

			return c.json(...SuccessResponse('ลบนักเรียนสำเร็จ!', null));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	setStatus: async (c: Context) => {
		try {
			const id = c.req.param('id');
			const status = c.req.param('status') as
				| 'created'
				| 'draft'
				| 'submitted'
				| 'approved'
				| 'rejected';

			if (!id) return c.json(...FailedResponse('ไม่พบ ID นักเรียน'));
			if (!isValidObjectId(id))
				return c.json(...FailedResponse('รูปแบบ ID นักเรียนไม่ถูกต้อง'));

			if (!['created', 'draft', 'submitted', 'approved', 'rejected'].includes(status)) {
				return c.json(...FailedResponse('สถานะไม่ถูกต้อง'));
			}

			const updatedStudent = await StudentModel.setStatus(id, status);

			if (!updatedStudent) return c.json(...FailedResponse('ไม่พบนักเรียน'));

			return c.json(...SuccessResponse('อัปเดตสถานะนักเรียนสำเร็จ!', updatedStudent));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	submitForm: async (c: Context) => {
		try {
			const id = c.req.param('id');

			if (!id) return c.json(...FailedResponse('ไม่พบ ID นักเรียน'));
			if (!isValidObjectId(id))
				return c.json(...FailedResponse('รูปแบบ ID นักเรียนไม่ถูกต้อง'));

			const { formData, jsonData } = await parseFormDataPayload(c);

			const payload = await ValidatePayload<studentPayload.SubmitForm>(
				{ req: { json: () => jsonData } } as Context,
				ValidatorSchema.StudentPayload.submitForm
			);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			const existingStudent = await StudentModel.getById(id);
			if (!existingStudent) return c.json(...FailedResponse('ไม่พบนักเรียน'));

			let processedFormData = payload.data.form_data;

			if (formData.entries().next().value) {
				try {
					const fileData = await StorageUtil.processFormDataFiles(formData);
					processedFormData = { ...processedFormData, ...fileData };
					
					await StorageUtil.cleanupOldFiles(existingStudent.form_data, processedFormData);
				} catch (storageError) {
					return c.json(...ErrorResponse(storageError));
				}
			}

			const fullname = extractFullname(processedFormData);

			const submittedStudent = await StudentModel.submitForm(id, processedFormData, fullname);

			if (!submittedStudent) return c.json(...FailedResponse('ไม่พบนักเรียน'));

			return c.json(...SuccessResponse('ส่งฟอร์มสำเร็จ!', submittedStudent));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	getCountByScholar: async (c: Context) => {
		try {
			const scholarId = c.req.param('scholarId');

			if (!scholarId) return c.json(...FailedResponse('ไม่พบ ID ทุนการศึกษา'));
			if (!isValidObjectId(scholarId))
				return c.json(...FailedResponse('รูปแบบ ID ทุนการศึกษาไม่ถูกต้อง'));

			const count = await StudentModel.countByScholar(scholarId);

			return c.json(...SuccessResponse('ดึงจำนวนนักเรียนสำเร็จ', { count }));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},
};

export { StudentController };
