import * as mongoose from 'mongoose';

type StudentType = {
	scholar_id: mongoose.Types.ObjectId;
	form_data: Record<string, any>;
	fullname?: string;
	status: 'incomplete' | 'completed';
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
			enum: ['incomplete', 'completed'],
			required: true,
			default: 'incomplete',
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
	getByStatus: async (status: 'incomplete' | 'completed') => {
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
	setStatus: async (id: string, status: 'incomplete' | 'completed') => {
		const updateData: any = { status, updated_at: new Date() };
		if (status === 'completed') {
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
			status: 'completed',
			submitted_at: new Date(),
			updated_at: new Date(),
		};

		if (fullname) {
			updateData.fullname = fullname;
		}

		return await Student.findByIdAndUpdate(id, updateData, {
			new: true,
			runValidators: true,
		}).populate('scholar_id');
	},
	countByScholar: async (scholarId: string) => {
		return await Student.countDocuments({ scholar_id: scholarId });
	},
	deleteByScholar: async (scholarId: string) => {
		return await Student.deleteMany({ scholar_id: scholarId });
	},

	checkFormCompletion: async (studentId: string, scholarFields: any[]): Promise<boolean> => {
		const student = await Student.findById(studentId);
		if (!student) return false;

		const formData = student.form_data || {};

		for (const field of scholarFields) {
			const fieldData = formData[field._id] || {};

			// Check ALL questions regardless of required flag - all fields are considered required
			for (const question of field.questions) {
				const value = fieldData[question.question_id];

				// Check if the value is empty or null
				if (value === null || value === undefined || value === '') {
					return false;
				}

				// For arrays (checkboxes, multiple files), check if they have content
				if (Array.isArray(value) && value.length === 0) {
					return false;
				}

				// For radio buttons with "other" option, check if other text is provided
				if (value === 'other' && question.allow_other) {
					const otherValue = fieldData[`${question.question_id}_other`];
					if (!otherValue || otherValue.trim() === '') {
						return false;
					}
				}

				// For checkboxes with "other" option, check if other text is provided when "other" is selected
				if (Array.isArray(value) && value.includes('other') && question.allow_other) {
					const otherValue = fieldData[`${question.question_id}_other`];
					if (!otherValue || otherValue.trim() === '') {
						return false;
					}
				}

				// For table questions, check if ALL cells are filled
				if (question.question_type === 'table' && question.table_config) {
					const tableData = value || {};
					const { rows, columns } = question.table_config;

					// Check all data cells (excluding headers)
					for (let row = 1; row < rows; row++) {
						for (let col = 1; col < columns; col++) {
							const cellKey = `${row}_${col}`;
							const cellValue = tableData[cellKey];
							if (!cellValue || cellValue.trim() === '') {
								return false;
							}
						}
					}
				}
			}
		}

		return true;
	},

	updateAllStudentStatusForScholar: async (
		scholarId: string,
		scholarFields: any[]
	): Promise<void> => {
		try {
			// Get all students for this scholar
			const students = await Student.find({ scholar_id: scholarId });

			const bulkOperations = [];

			for (const student of students) {
				// Check completion for each student
				const isComplete = await StudentModel.checkFormCompletion(
					student._id.toString(),
					scholarFields
				);
				const newStatus = isComplete ? 'completed' : 'incomplete';

				// Only update if status has changed
				if (student.status !== newStatus) {
					const updateData: any = {
						status: newStatus,
						updated_at: new Date(),
					};

					// Set submitted_at if marking as completed and it doesn't already exist
					if (newStatus === 'completed' && !student.submitted_at) {
						updateData.submitted_at = new Date();
					}

					bulkOperations.push({
						updateOne: {
							filter: { _id: student._id },
							update: updateData,
						},
					});
				}
			}

			// Perform bulk update if there are operations
			if (bulkOperations.length > 0) {
				await Student.bulkWrite(bulkOperations);
				// console.log(`Updated ${bulkOperations.length} students for scholar ${scholarId}`);
			}
		} catch (error) {
			console.error('Error updating student statuses for scholar:', scholarId, error);
			throw error;
		}
	},

	// Helper function to recursively search through form_data
	searchInFormData: (obj: any, keyword: string): boolean => {
		if (!obj || typeof obj !== 'object') {
			return String(obj || '').toLowerCase().includes(keyword.toLowerCase());
		}

		for (const key in obj) {
			const value = obj[key];
			
			// Search in the key itself
			if (key.toLowerCase().includes(keyword.toLowerCase())) {
				return true;
			}
			
			// Search in primitive values
			if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
				if (String(value).toLowerCase().includes(keyword.toLowerCase())) {
					return true;
				}
			}
			
			// Search in arrays
			if (Array.isArray(value)) {
				for (const item of value) {
					if (StudentModel.searchInFormData(item, keyword)) {
						return true;
					}
				}
			}
			
			// Search in nested objects
			if (value && typeof value === 'object') {
				if (StudentModel.searchInFormData(value, keyword)) {
					return true;
				}
			}
		}
		
		return false;
	},

	// Helper function to check if student matches keyword
	matchesKeyword: (student: any, keyword: string): boolean => {
		// Search in fullname
		if (student.fullname && student.fullname.toLowerCase().includes(keyword.toLowerCase())) {
			return true;
		}
		
		// Search in form_data
		if (student.form_data && StudentModel.searchInFormData(student.form_data, keyword)) {
			return true;
		}
		
		return false;
	},

	search: async (keyword: string) => {
		// Get all students with populated scholar data
		const allStudents = await StudentModel.getAll();
		
		// Filter students that match the keyword
		const matchingStudents = allStudents.filter(student => 
			StudentModel.matchesKeyword(student, keyword)
		);
		
		return matchingStudents;
	},

	searchByScholar: async (scholarId: string, keyword: string) => {
		// Get all students for the specific scholar with populated scholar data
		const scholarStudents = await StudentModel.getByScholar(scholarId);
		
		// Filter students that match the keyword
		const matchingStudents = scholarStudents.filter(student => 
			StudentModel.matchesKeyword(student, keyword)
		);
		
		return matchingStudents;
	},
};

export { StudentModel };
