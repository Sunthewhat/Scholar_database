import { Context } from 'hono';
import { ScholarFieldModel } from '@/model/scholarField';
import { StudentModel } from '@/model/student';
import { scholarFieldPayload } from '@/types/payload';
import { ValidatePayload, ValidatorSchema } from '@/util/zod';
import { ErrorResponse, FailedResponse, SuccessResponse } from '@/util/response';
import * as mongoose from 'mongoose';

// Helper function to update all student statuses for a scholar when fields change
const updateStudentStatusesForScholar = async (scholarId: string) => {
	try {
		const scholarFields = await ScholarFieldModel.getByScholarId(scholarId);
		await StudentModel.updateAllStudentStatusForScholar(scholarId, scholarFields);
	} catch (error) {
		console.error('Error updating student statuses after field change:', error);
		// Don't throw error to prevent field operations from failing
	}
};

const ScholarFieldController = {
	// Create a new field for a scholar
	create: async (c: Context) => {
		try {
			const payload = await ValidatePayload<scholarFieldPayload.CreateField>(
				c,
				ValidatorSchema.ScholarFieldPayload.createField
			);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			const newField = await ScholarFieldModel.create({
				...payload.data,
				scholar_id: new mongoose.Types.ObjectId(payload.data.scholar_id)
			});

			// Update student statuses for this scholar (async, don't wait)
			updateStudentStatusesForScholar(payload.data.scholar_id);

			return c.json(...SuccessResponse('สร้างฟิลด์สำเร็จ!', newField));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	// Get all fields for a scholar
	getByScholarId: async (c: Context) => {
		try {
			const scholarId = c.req.param('scholarId');

			if (!scholarId) return c.json(...FailedResponse('ไม่พบ ID ทุนการศึกษา'));

			const fields = await ScholarFieldModel.getByScholarId(scholarId);

			return c.json(...SuccessResponse('ดึงข้อมูลฟิลด์สำเร็จ', fields));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	// Get a specific field by ID
	getById: async (c: Context) => {
		try {
			const id = c.req.param('id');

			if (!id) return c.json(...FailedResponse('ไม่พบ ID ฟิลด์'));

			const field = await ScholarFieldModel.getById(id);

			if (!field) return c.json(...FailedResponse('ไม่พบฟิลด์', 404));

			return c.json(...SuccessResponse('ดึงข้อมูลฟิลด์สำเร็จ', field));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	// Update a field
	update: async (c: Context) => {
		try {
			const id = c.req.param('id');

			if (!id) return c.json(...FailedResponse('ไม่พบ ID ฟิลด์'));

			const payload = await ValidatePayload<scholarFieldPayload.UpdateField>(
				c,
				ValidatorSchema.ScholarFieldPayload.updateField
			);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			const updatedField = await ScholarFieldModel.update(id, payload.data);

			if (!updatedField) return c.json(...FailedResponse('ไม่พบฟิลด์', 404));

			// Update student statuses for this scholar (async, don't wait)
			updateStudentStatusesForScholar(updatedField.scholar_id.toString());

			return c.json(...SuccessResponse('อัปเดตฟิลด์สำเร็จ!', updatedField));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	// Delete a field
	delete: async (c: Context) => {
		try {
			const id = c.req.param('id');

			if (!id) return c.json(...FailedResponse('ไม่พบ ID ฟิลด์'));

			const deletedField = await ScholarFieldModel.delete(id);

			if (!deletedField) return c.json(...FailedResponse('ไม่พบฟิลด์', 404));

			// Update student statuses for this scholar (async, don't wait)
			updateStudentStatusesForScholar(deletedField.scholar_id.toString());

			return c.json(...SuccessResponse('ลบฟิลด์สำเร็จ!', deletedField));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	// Reorder fields for a scholar
	reorderFields: async (c: Context) => {
		try {
			const payload = await ValidatePayload<scholarFieldPayload.ReorderFields>(
				c,
				ValidatorSchema.ScholarFieldPayload.reorderFields
			);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			const result = await ScholarFieldModel.reorderFields(
				payload.data.scholar_id,
				payload.data.field_orders
			);

			return c.json(...SuccessResponse('เรียงลำดับฟิลด์สำเร็จ!', result));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	// Add a question to a field
	addQuestion: async (c: Context) => {
		try {
			const fieldId = c.req.param('fieldId');

			if (!fieldId) return c.json(...FailedResponse('ไม่พบ ID ฟิลด์'));

			const payload = await ValidatePayload<scholarFieldPayload.CreateQuestion>(
				c,
				ValidatorSchema.ScholarFieldPayload.createQuestion
			);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			const updatedField = await ScholarFieldModel.addQuestion(fieldId, payload.data);

			if (!updatedField) return c.json(...FailedResponse('ไม่พบฟิลด์', 404));

			// Update student statuses for this scholar (async, don't wait)
			updateStudentStatusesForScholar(updatedField.scholar_id.toString());

			return c.json(...SuccessResponse('เพิ่มคำถามสำเร็จ!', updatedField));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	// Update a question in a field
	updateQuestion: async (c: Context) => {
		try {
			const fieldId = c.req.param('fieldId');
			const questionId = c.req.param('questionId');

			if (!fieldId) return c.json(...FailedResponse('ไม่พบ ID ฟิลด์'));
			if (!questionId) return c.json(...FailedResponse('ไม่พบ ID คำถาม'));

			const payload = await ValidatePayload<scholarFieldPayload.UpdateQuestion>(
				c,
				ValidatorSchema.ScholarFieldPayload.updateQuestion
			);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			const updatedField = await ScholarFieldModel.updateQuestion(
				fieldId,
				questionId,
				payload.data
			);

			if (!updatedField) return c.json(...FailedResponse('ไม่พบฟิลด์หรือคำถาม', 404));

			// Update student statuses for this scholar (async, don't wait)
			updateStudentStatusesForScholar(updatedField.scholar_id.toString());

			return c.json(...SuccessResponse('อัปเดตคำถามสำเร็จ!', updatedField));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	// Remove a question from a field
	removeQuestion: async (c: Context) => {
		try {
			const fieldId = c.req.param('fieldId');
			const questionId = c.req.param('questionId');

			if (!fieldId) return c.json(...FailedResponse('ไม่พบ ID ฟิลด์'));
			if (!questionId) return c.json(...FailedResponse('ไม่พบ ID คำถาม'));

			const updatedField = await ScholarFieldModel.removeQuestion(fieldId, questionId);

			if (!updatedField) return c.json(...FailedResponse('ไม่พบฟิลด์', 404));

			// Update student statuses for this scholar (async, don't wait)
			updateStudentStatusesForScholar(updatedField.scholar_id.toString());

			return c.json(...SuccessResponse('ลบคำถามสำเร็จ!', updatedField));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},

	// Reorder questions in a field
	reorderQuestions: async (c: Context) => {
		try {
			const payload = await ValidatePayload<scholarFieldPayload.ReorderQuestions>(
				c,
				ValidatorSchema.ScholarFieldPayload.reorderQuestions
			);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			const updatedField = await ScholarFieldModel.reorderQuestions(
				payload.data.field_id,
				payload.data.question_orders
			);

			if (!updatedField) return c.json(...FailedResponse('ไม่พบฟิลด์', 404));

			return c.json(...SuccessResponse('เรียงลำดับคำถามสำเร็จ!', updatedField));
		} catch (e) {
			return c.json(...ErrorResponse(e));
		}
	},
};

export { ScholarFieldController };