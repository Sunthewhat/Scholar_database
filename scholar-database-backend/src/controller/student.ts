import { Context } from 'hono';
import { StudentModel } from '@/model/student';
import { ScholarFieldModel } from '@/model/scholarField';
import { studentPayload } from '@/types/payload';
import { ValidatePayload, ValidatorSchema } from '@/util/zod';
import { ErrorResponse, FailedResponse, SuccessResponse } from '@/util/response';
import { StorageUtil } from '@/util/storage';
import { parseFormDataPayload } from '@/util/formData';
import * as mongoose from 'mongoose';
import * as jwt from 'hono/jwt';

// Deep merge utility function
const deepMerge = (target: Record<string, any>, source: Record<string, any>): Record<string, any> => {
	const result = { ...target };
	
	for (const key in source) {
		if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
			if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
				result[key] = deepMerge(target[key], source[key]);
			} else {
				result[key] = source[key];
			}
		} else {
			result[key] = source[key];
		}
	}
	
	return result;
};

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
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},

	getAll: async (c: Context) => {
		try {
			const students = await StudentModel.getAll();
			return c.json(...SuccessResponse('ดึงข้อมูลนักเรียนสำเร็จ', students));
		} catch (e) {
			console.error(e);

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
			console.error(e);

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
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},

	getByStatus: async (c: Context) => {
		try {
			const status = c.req.param('status') as 'incomplete' | 'completed';

			if (!['incomplete', 'completed'].includes(status)) {
				return c.json(...FailedResponse('สถานะไม่ถูกต้อง'));
			}

			const students = await StudentModel.getByStatus(status);

			return c.json(...SuccessResponse('ดึงข้อมูลนักเรียนสำเร็จ', students));
		} catch (e) {
			console.error(e);

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

				// Merge with existing form_data to preserve fields not being updated
				let processedFormData = { ...existingStudent.form_data, ...payload.data.form_data };

				const hasFormDataFiles = formData.entries().next().value;

				if (hasFormDataFiles) {
					try {
						const fileData = await StorageUtil.processFormDataFiles(formData);
						
						// Deep merge to preserve nested object properties
						processedFormData = deepMerge(processedFormData, fileData);

						await StorageUtil.cleanupOldFiles(
							existingStudent.form_data,
							processedFormData
						);
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

			// Check form completion and set status automatically
			if (payload.data.form_data) {
				try {
					// Get scholar fields to check completion
					const existingStudent = await StudentModel.getById(id);
					if (existingStudent) {
						const scholarId =
							typeof existingStudent.scholar_id === 'object'
								? existingStudent.scholar_id._id
								: existingStudent.scholar_id;

						const scholarFields = await ScholarFieldModel.getByScholarId(
							scholarId.toString()
						);

						// Update the student first, then check completion
						await StudentModel.update(id, updateData);

						const isComplete = await StudentModel.checkFormCompletion(
							id,
							scholarFields
						);
						const finalStatus = isComplete ? 'completed' : 'incomplete';

						// Update status based on completion
						const finalUpdatedStudent = await StudentModel.setStatus(id, finalStatus);

						if (!finalUpdatedStudent) return c.json(...FailedResponse('ไม่พบนักเรียน'));

						return c.json(
							...SuccessResponse('อัปเดตข้อมูลนักเรียนสำเร็จ!', finalUpdatedStudent)
						);
					}
				} catch (completionError) {
					console.error('Error checking completion:', completionError);
					// If completion check fails, proceed with normal update
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

			await StudentModel.delete(id);

			return c.json(...SuccessResponse('ลบนักเรียนสำเร็จ!', null));
		} catch (e) {
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},

	setStatus: async (c: Context) => {
		try {
			const id = c.req.param('id');
			const status = c.req.param('status') as 'incomplete' | 'completed';

			if (!id) return c.json(...FailedResponse('ไม่พบ ID นักเรียน'));
			if (!isValidObjectId(id))
				return c.json(...FailedResponse('รูปแบบ ID นักเรียนไม่ถูกต้อง'));

			if (!['incomplete', 'completed'].includes(status)) {
				return c.json(...FailedResponse('สถานะไม่ถูกต้อง'));
			}

			const updatedStudent = await StudentModel.setStatus(id, status);

			if (!updatedStudent) return c.json(...FailedResponse('ไม่พบนักเรียน'));

			return c.json(...SuccessResponse('อัปเดตสถานะนักเรียนสำเร็จ!', updatedStudent));
		} catch (e) {
			console.error(e);

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

			// First update the form data
			const submittedStudent = await StudentModel.update(id, {
				form_data: processedFormData,
				fullname: fullname,
			});

			if (!submittedStudent) return c.json(...FailedResponse('ไม่พบนักเรียน'));

			// Then check completion and set final status
			try {
				const scholarId =
					typeof submittedStudent.scholar_id === 'object'
						? submittedStudent.scholar_id._id
						: submittedStudent.scholar_id;

				const scholarFields = await ScholarFieldModel.getByScholarId(scholarId.toString());
				const isComplete = await StudentModel.checkFormCompletion(id, scholarFields);
				const finalStatus = isComplete ? 'completed' : 'incomplete';

				const finalStudent = await StudentModel.setStatus(id, finalStatus);

				return c.json(...SuccessResponse('ส่งฟอร์มสำเร็จ!', finalStudent));
			} catch (completionError) {
				console.error('Error checking completion in submitForm:', completionError);
				// If completion check fails, set as completed anyway since it's a submit action
				const finalStudent = await StudentModel.setStatus(id, 'completed');
				return c.json(...SuccessResponse('ส่งฟอร์มสำเร็จ!', finalStudent));
			}
		} catch (e) {
			console.error(e);

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
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},

	generateTempPermission: async (c: Context) => {
		try {
			const payload = await ValidatePayload<studentPayload.GenerateTempPermission>(
				c,
				ValidatorSchema.StudentPayload.generateTempPermission
			);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			const student = await StudentModel.getById(payload.data.student_id);
			if (!student) return c.json(...FailedResponse('ไม่พบนักเรียน'));

			const jwt_secret = Bun.env.JWT_SECRET;
			if (!jwt_secret) throw new Error('JWT_SECRET is not defined');

			const expirationTime =
				Math.floor(Date.now() / 1000) + (payload.data.expires_in || 3600);

			const token = await jwt.sign(
				{
					student_id: payload.data.student_id,
					type: 'temp_permission',
					exp: expirationTime,
				},
				jwt_secret
			);

			return c.json(
				...SuccessResponse('สร้าง Token สำหรับแก้ไขฟอร์มสำเร็จ', {
					token,
					expires_at: new Date(expirationTime * 1000).toISOString(),
					student_id: payload.data.student_id,
				})
			);
		} catch (e) {
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},

	verifyTempPermission: async (c: Context) => {
		try {
			const payload = await ValidatePayload<studentPayload.VerifyTempPermission>(
				c,
				ValidatorSchema.StudentPayload.verifyTempPermission
			);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			const jwt_secret = Bun.env.JWT_SECRET;
			if (!jwt_secret) throw new Error('JWT_SECRET is not defined');

			try {
				const decoded = (await jwt.verify(payload.data.token, jwt_secret)) as {
					student_id: string;
					type: string;
					exp: number;
				};

				if (decoded.type !== 'temp_permission') {
					return c.json(...FailedResponse('Token ไม่ถูกต้อง'));
				}

				if (decoded.student_id !== payload.data.student_id) {
					return c.json(...FailedResponse('Token ไม่ตรงกับ Student ID'));
				}

				const currentTime = Math.floor(Date.now() / 1000);
				if (decoded.exp < currentTime) {
					return c.json(...FailedResponse('Token หมดอายุแล้ว'));
				}

				const student = await StudentModel.getById(payload.data.student_id);
				if (!student) return c.json(...FailedResponse('ไม่พบนักเรียน'));

				return c.json(
					...SuccessResponse('Token ถูกต้อง', {
						valid: true,
						student_id: decoded.student_id,
						expires_at: new Date(decoded.exp * 1000).toISOString(),
						student: student,
					})
				);
			} catch (verifyError) {
				return c.json(...FailedResponse('Token ไม่ถูกต้องหรือหมดอายุ'));
			}
		} catch (e) {
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},
};

export { StudentController };
