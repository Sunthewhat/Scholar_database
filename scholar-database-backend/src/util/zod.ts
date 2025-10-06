import { Context } from 'hono';
import { z, ZodError } from 'zod';

type ValidatePayloadType<T> =
	| {
			success: true;
			data: T;
	  }
	| {
			success: false;
			error: any;
	  };

export const ValidatePayload = async <T>(
	c: Context,
	schema: z.ZodObject<any>
): Promise<ValidatePayloadType<T>> => {
	try {
		const body = await c.req.json<T>();
		// console.log('Parsed JSON body:', body);
		const validatedData = schema.parse(body) as T;
		return {
			success: true,
			data: validatedData,
		};
	} catch (e: any) {
		console.error('ValidatePayload error:', e);

		// Check if it's a JSON parsing error
		if (e instanceof SyntaxError) {
			console.error('JSON parsing failed:', e.message);
			return {
				success: false,
				error: `JSON Parse error: ${e.message}`,
			};
		}

		// Handle Zod validation errors
		if (e instanceof ZodError) {
			console.error('Zod validation failed:', e.message);
			return {
				success: false,
				error: (JSON.parse(e.message) as { message: string }[])
					.map((m) => m.message)
					.join(', '),
			};
		}

		// Handle other errors
		console.error('Unknown validation error:', e);
		return {
			success: false,
			error: e.message || 'Unknown validation error',
		};
	}
};
export const ValidatorSchema = {
	AuthPayload: {
		login: z.object({
			username: z.string({ required_error: 'Missing username' }).min(1),
			password: z.string({ required_error: 'Missing password' }).min(1),
		}),
		create: z.object({
			username: z.string({ required_error: 'Missing username' }).min(1),
			password: z.string({ required_error: 'Missing password' }).min(1),
			firstname: z.string({ required_error: 'Missing firstname' }).min(1),
			lastname: z.string({ required_error: 'Missing lastname' }).min(1),
		}),
		createByAdmin: z.object({
			username: z.string({ required_error: 'Missing username' }).min(1),
			firstname: z.string({ required_error: 'Missing firstname' }).min(1),
			lastname: z.string({ required_error: 'Missing lastname' }).min(1),
		}),
		changePassword: z.object({
			current_password: z.string({ required_error: 'Missing current password' }).min(1),
			new_password: z
				.string({ required_error: 'Missing new password' })
				.min(6, { message: 'New password must be at least 6 characters' }),
		}),
		changeRole: z.object({
			role: z.enum(['admin', 'maintainer'], {
				errorMap: () => ({ message: 'Role must be admin or maintainer' }),
			}),
		}),
	},
	ScholarPayload: {
		create: z.object({
			name: z
				.string({ required_error: 'Missing scholar name' })
				.min(1, { message: 'Scholar name is required' }),
			description: z
				.string({ required_error: 'Missing scholar description' })
				.min(1, { message: 'Scholar description is required' }),
		}),
		update: z.object({
			name: z.string().min(1, { message: 'Scholar name cannot be empty' }).optional(),
			description: z
				.string()
				.min(1, { message: 'Scholar description cannot be empty' })
				.optional(),
			status: z
				.enum(['active', 'inactive'], {
					errorMap: () => ({ message: 'Status must be active or inactive' }),
				})
				.optional(),
		}),
	},
	ScholarFieldPayload: {
		validationRule: z.object({
			min_length: z.number().optional(),
			max_length: z.number().optional(),
			required_files: z.number().optional(),
			max_file_size: z.number().optional(),
			allowed_extensions: z.array(z.string()).optional(),
			min_date: z.date().optional(),
			max_date: z.date().optional(),
		}),
		tableConfig: z.object({
			rows: z
				.number({ required_error: 'Number of rows is required' })
				.min(1, { message: 'Must have at least 1 row' }),
			columns: z
				.number({ required_error: 'Number of columns is required' })
				.min(1, { message: 'Must have at least 1 column' }),
			row_labels: z.array(z.string()).optional(),
			column_labels: z.array(z.string()).optional(),
		}),
		question: z.object({
			question_id: z.string({ required_error: 'Question ID is required' }).min(1),
			question_type: z.enum(
				[
					'short_answer',
					'long_answer',
					'radio',
					'checkbox',
					'dropdown',
					'table',
					'date',
					'time',
					'file_upload',
				],
				{ errorMap: () => ({ message: 'Invalid question type' }) }
			),
			question_label: z.string({ required_error: 'Question label is required' }).min(1),
			required: z
				.boolean({ invalid_type_error: 'Required field must be boolean' })
				.default(false)
				.optional(),
			options: z.array(z.string()).optional(),
			allow_other: z
				.boolean({ invalid_type_error: 'Allow other field must be boolean' })
				.default(false)
				.optional(),
			validation: z.lazy((): z.ZodOptional<z.ZodObject<any>> => ValidatorSchema.ScholarFieldPayload.validationRule.optional()),
			placeholder: z.string().optional(),
			help_text: z.string().optional(),
			table_config: z.lazy((): z.ZodOptional<z.ZodObject<any>> => ValidatorSchema.ScholarFieldPayload.tableConfig.optional()),
			file_types: z.array(z.string()).optional(),
			allow_multiple: z
				.boolean({ invalid_type_error: 'Allow multiple files field must be boolean' })
				.default(false)
				.optional(),
			order: z.number({ required_error: 'Question order is required' }).min(0),
		}),
		createField: z.object({
			scholar_id: z.string({ required_error: 'Scholar ID is required' }).min(1),
			field_name: z.string({ required_error: 'Field name is required' }).min(1),
			field_label: z.string({ required_error: 'Field label is required' }).min(1),
			field_description: z.string().optional(),
			order: z.number({ required_error: 'Field order is required' }).min(0),
			questions: z.array(z.lazy((): z.ZodObject<any> => ValidatorSchema.ScholarFieldPayload.question)),
		}),
		updateField: z.object({
			field_name: z.string().min(1, { message: 'Field name cannot be empty' }).optional(),
			field_label: z.string().min(1, { message: 'Field label cannot be empty' }).optional(),
			field_description: z.string().optional(),
			order: z.number().min(0).optional(),
			questions: z
				.array(z.lazy((): z.ZodObject<any> => ValidatorSchema.ScholarFieldPayload.question))
				.optional(),
		}),
		createQuestion: z.lazy((): z.ZodObject<any> => ValidatorSchema.ScholarFieldPayload.question),
		updateQuestion: z.lazy((): z.ZodObject<any> => ValidatorSchema.ScholarFieldPayload.question.partial()),
		reorderFields: z.object({
			scholar_id: z.string({ required_error: 'Scholar ID is required' }).min(1),
			field_orders: z.array(
				z.object({
					id: z.string({ required_error: 'Field ID is required' }).min(1),
					order: z.number({ required_error: 'Order is required' }).min(0),
				})
			),
		}),
		reorderQuestions: z.object({
			field_id: z.string({ required_error: 'Field ID is required' }).min(1),
			question_orders: z.array(
				z.object({
					question_id: z.string({ required_error: 'Question ID is required' }).min(1),
					order: z.number({ required_error: 'Order is required' }).min(0),
				})
			),
		}),
	},
	StudentPayload: {
		create: z.object({
			scholar_id: z
				.string({ required_error: 'Scholar ID is required' })
				.min(1)
				.regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid Scholar ID format' }),
			form_data: z.record(z.any()).optional().default({}),
		}),
		update: z.object({
			form_data: z.record(z.any()).optional(),
			status: z
				.enum(['incomplete', 'completed'], {
					errorMap: () => ({ message: 'Invalid status' }),
				})
				.optional(),
		}),
		submitForm: z.object({
			form_data: z.record(z.any()),
		}),
		generateTempPermission: z.object({
			student_id: z
				.string({ required_error: 'Student ID is required' })
				.min(1)
				.regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid Student ID format' }),
			expires_in: z.number().positive().optional().default(3600),
		}),
		verifyTempPermission: z.object({
			token: z.string({ required_error: 'Token is required' }).min(1),
			student_id: z
				.string({ required_error: 'Student ID is required' })
				.min(1)
				.regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid Student ID format' }),
		}),
	},
};
