import * as mongoose from 'mongoose';

type QuestionType =
	| 'short_answer'
	| 'long_answer'
	| 'radio'
	| 'checkbox'
	| 'dropdown'
	| 'table'
	| 'date'
	| 'time'
	| 'file_upload';

type ValidationRule = {
	min_length?: number;
	max_length?: number;
	required_files?: number;
	max_file_size?: number;
	allowed_extensions?: string[];
	min_date?: Date;
	max_date?: Date;
};

type TableConfig = {
	rows: number;
	columns: number;
	row_labels?: string[];
	column_labels?: string[];
};

type Question = {
	question_id: string;
	question_type: QuestionType;
	question_label: string;
	required: boolean;
	options?: string[];
	allow_other?: boolean;
	validation?: ValidationRule;
	placeholder?: string;
	help_text?: string;
	table_config?: TableConfig;
	file_types?: string[];
	allow_multiple?: boolean;
	order: number;
};

type ScholarFieldType = {
	scholar_id: mongoose.Types.ObjectId;
	field_name: string;
	field_label: string;
	field_description?: string;
	order: number;
	questions: Question[];
	created_at: Date;
	updated_at: Date;
};

const validationRuleSchema = new mongoose.Schema(
	{
		min_length: { type: Number },
		max_length: { type: Number },
		required_files: { type: Number },
		max_file_size: { type: Number },
		allowed_extensions: [{ type: String }],
		min_date: { type: Date },
		max_date: { type: Date },
	},
	{ _id: false }
);

const tableConfigSchema = new mongoose.Schema(
	{
		rows: { type: Number, required: true },
		columns: { type: Number, required: true },
		row_labels: [{ type: String }],
		column_labels: [{ type: String }],
	},
	{ _id: false }
);

const questionSchema = new mongoose.Schema(
	{
		question_id: { type: String, required: true },
		question_type: {
			type: String,
			enum: [
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
			required: true,
		},
		question_label: { type: String, required: true },
		required: { type: Boolean, required: true, default: false },
		options: [{ type: String }],
		allow_other: { type: Boolean, default: false },
		validation: validationRuleSchema,
		placeholder: { type: String },
		help_text: { type: String },
		table_config: tableConfigSchema,
		file_types: [{ type: String }],
		allow_multiple: { type: Boolean, default: false },
		order: { type: Number, required: true },
	},
	{ _id: false }
);

const scholarFieldSchema = new mongoose.Schema<ScholarFieldType>(
	{
		scholar_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholar', required: true },
		field_name: { type: String, required: true },
		field_label: { type: String, required: true },
		field_description: { type: String },
		order: { type: Number, required: true },
		questions: [questionSchema],
		created_at: { type: Date, required: true, default: Date.now },
		updated_at: { type: Date, required: true, default: Date.now },
	},
	{ strict: true }
);

// Create compound index for scholar_id and order for efficient querying
scholarFieldSchema.index({ scholar_id: 1, order: 1 });

export type { QuestionType, ValidationRule, TableConfig, Question };
export type ScholarField = mongoose.InferSchemaType<typeof scholarFieldSchema>;
export const ScholarField = mongoose.model('ScholarField', scholarFieldSchema);

// Update timestamp on save
scholarFieldSchema.pre('save', function (next) {
	this.updated_at = new Date();
	next();
});

scholarFieldSchema.pre('findOneAndUpdate', function (next) {
	this.set({ updated_at: new Date() });
	next();
});

const ScholarFieldModel = {
	create: async (field: Omit<ScholarField, 'created_at' | 'updated_at'>) => {
		return await new ScholarField(field).save();
	},
	getByScholarId: async (scholar_id: string) => {
		return await ScholarField.find({ scholar_id }).sort({ order: 1 });
	},
	getById: async (id: string) => {
		return await ScholarField.findById(id);
	},
	update: async (
		id: string,
		data: Partial<Omit<ScholarField, '_id' | 'created_at' | 'updated_at'>>
	) => {
		return await ScholarField.findByIdAndUpdate(id, data, { new: true });
	},
	delete: async (id: string) => {
		return await ScholarField.findByIdAndDelete(id);
	},
	deleteByScholarId: async (scholar_id: string) => {
		return await ScholarField.deleteMany({ scholar_id });
	},
	reorderFields: async (scholar_id: string, fieldOrders: { id: string; order: number }[]) => {
		const bulkOps = fieldOrders.map(({ id, order }) => ({
			updateOne: {
				filter: { _id: id, scholar_id },
				update: { order, updated_at: new Date() },
			},
		}));
		return await ScholarField.bulkWrite(bulkOps);
	},
	getMaxOrder: async (scholar_id: string) => {
		const result = await ScholarField.findOne({ scholar_id })
			.sort({ order: -1 })
			.select('order');
		return result?.order ?? 0;
	},
	// New methods for question management
	addQuestion: async (field_id: string, question: Question) => {
		return await ScholarField.findByIdAndUpdate(
			field_id,
			{ $push: { questions: question }, updated_at: new Date() },
			{ new: true }
		);
	},
	updateQuestion: async (
		field_id: string,
		question_id: string,
		questionData: Partial<Question>
	) => {
		return await ScholarField.findOneAndUpdate(
			{ _id: field_id, 'questions.question_id': question_id },
			{
				$set: {
					...Object.keys(questionData).reduce((acc, key) => {
						acc[`questions.$.${key}`] = questionData[key as keyof Question];
						return acc;
					}, {} as any),
					updated_at: new Date(),
				},
			},
			{ new: true }
		);
	},
	removeQuestion: async (field_id: string, question_id: string) => {
		return await ScholarField.findByIdAndUpdate(
			field_id,
			{ $pull: { questions: { question_id } }, updated_at: new Date() },
			{ new: true }
		);
	},
	reorderQuestions: async (
		field_id: string,
		questionOrders: { question_id: string; order: number }[]
	) => {
		const field = await ScholarField.findById(field_id);
		if (!field) return null;

		// Update question orders
		field.questions.forEach((question) => {
			const newOrder = questionOrders.find(
				(q) => q.question_id === question.question_id
			)?.order;
			if (newOrder !== undefined) {
				question.order = newOrder;
			}
		});

		// Sort questions by order
		field.questions.sort((a, b) => a.order - b.order);
		field.updated_at = new Date();

		return await field.save();
	},
};

export { ScholarFieldModel };
