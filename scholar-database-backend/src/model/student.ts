import * as mongoose from 'mongoose';

type StudentType = {
	scholar_id: mongoose.Types.ObjectId;
	form_data: Record<string, any>;
	fullname?: string;
	status: 'created' | 'draft' | 'submitted' | 'approved' | 'rejected';
	submitted_at?: Date;
	created_at: Date;
	updated_at: Date;
};

const studentSchema = new mongoose.Schema<StudentType>(
	{
		scholar_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholar', required: true },
		form_data: { type: mongoose.Schema.Types.Mixed, required: true, default: {} },
		fullname: { type: String },
		status: {
			type: String,
			enum: ['created', 'draft', 'submitted', 'approved', 'rejected'],
			required: true,
			default: 'created',
		},
		submitted_at: { type: Date },
		created_at: { type: Date, required: true, default: Date.now },
		updated_at: { type: Date, required: true, default: Date.now },
	},
	{ strict: true }
);

export type Student = mongoose.InferSchemaType<typeof studentSchema>;
export const Student = mongoose.model('Student', studentSchema);

const StudentModel = {
	create: async (s: Omit<Student, 'created_at' | 'updated_at' | 'status'>) => {
		return await new Student(s).save();
	},
	getAll: async () => {
		return await Student.find().populate('scholar_id');
	},
	getById: async (id: string) => {
		return await Student.findById(id).populate('scholar_id');
	},
	getByScholar: async (scholarId: string) => {
		return await Student.find({ scholar_id: scholarId }).populate('scholar_id');
	},
	getByStatus: async (status: 'created' | 'draft' | 'submitted' | 'approved' | 'rejected') => {
		return await Student.find({ status }).populate('scholar_id');
	},
	update: async (id: string, data: Partial<Omit<Student, '_id' | 'created_at'>>) => {
		return await Student.findByIdAndUpdate(
			id,
			{ ...data, updated_at: new Date() },
			{ new: true, runValidators: true }
		).populate('scholar_id');
	},
	delete: async (id: string) => {
		return await Student.findByIdAndDelete(id);
	},
	setStatus: async (
		id: string,
		status: 'created' | 'draft' | 'submitted' | 'approved' | 'rejected'
	) => {
		const updateData: any = { status, updated_at: new Date() };
		if (status === 'submitted') {
			updateData.submitted_at = new Date();
		}
		return await Student.findByIdAndUpdate(id, updateData, {
			new: true,
			runValidators: true,
		}).populate('scholar_id');
	},
	submitForm: async (id: string, formData: Record<string, any>, fullname?: string) => {
		const updateData: any = {
			form_data: formData,
			status: 'submitted',
			submitted_at: new Date(),
			updated_at: new Date(),
		};
		
		if (fullname) {
			updateData.fullname = fullname;
		}
		
		return await Student.findByIdAndUpdate(
			id,
			updateData,
			{ new: true, runValidators: true }
		).populate('scholar_id');
	},
	countByScholar: async (scholarId: string) => {
		return await Student.countDocuments({ scholar_id: scholarId });
	},
	deleteByScholar: async (scholarId: string) => {
		return await Student.deleteMany({ scholar_id: scholarId });
	},
};

export { StudentModel };
