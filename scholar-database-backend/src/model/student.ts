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

	generateCSVData: async (scholarId: string) => {
		// Get all students for the scholar with populated data
		const students = await StudentModel.getByScholar(scholarId);
		
		if (students.length === 0) {
			return { headers: [], rows: [] };
		}

		// Get scholar fields to map question IDs to labels
		const { ScholarFieldModel } = await import('@/model/scholarField');
		const scholarFields = await ScholarFieldModel.getByScholarId(scholarId);
		
		// Create question ID to label mapping
		const questionIdToLabel = new Map<string, string>();
		scholarFields.forEach((field: any) => {
			if (field.questions && Array.isArray(field.questions)) {
				field.questions.forEach((question: any) => {
					if (question.question_id && question.question_label) {
						questionIdToLabel.set(question.question_id, question.question_label);
					}
				});
			}
		});

		// Extract all possible form field keys from all students (excluding file fields)
		const allFormKeys = new Set<string>();
		students.forEach(student => {
			if (student.form_data) {
				Object.values(student.form_data).forEach((fieldData: any) => {
					if (fieldData && typeof fieldData === 'object') {
						Object.keys(fieldData).forEach(key => {
							// Skip file fields (they typically contain URLs or file objects)
							if (fieldData[key] && typeof fieldData[key] === 'string' && 
								fieldData[key].includes('/storage/')) {
								return; // Skip file URLs
							}
							if (fieldData[key] && typeof fieldData[key] === 'object' && 
								fieldData[key].filename) {
								return; // Skip file objects
							}
							// Skip special keys like 'initialized' and '_other' fields
							if (key === 'initialized' || key.endsWith('_other')) {
								return;
							}
							allFormKeys.add(key);
						});
					}
				});
			}
		});

		// Create CSV headers using question labels instead of IDs
		const questionHeaders = Array.from(allFormKeys)
			.sort()
			.map(questionId => questionIdToLabel.get(questionId) || questionId);

		const headers = [
			'ID',
			'Full Name',
			'Status',
			'Created At',
			'Updated At',
			'Submitted At',
			'Scholar Name',
			...questionHeaders
		];

		// Create CSV rows
		const rows = students.map(student => {
			const row: any[] = [
				student._id,
				student.fullname || '',
				student.status,
				student.created_at,
				student.updated_at,
				student.submitted_at || '',
(student.scholar_id as any)?.name || ''
			];

			// Add form data values in the same order as headers (excluding file fields)
			Array.from(allFormKeys).sort().forEach(key => {
				let value = '';
				if (student.form_data) {
					// Search through all field data for this key
					Object.values(student.form_data).forEach((fieldData: any) => {
						if (fieldData && typeof fieldData === 'object' && fieldData[key]) {
							// Skip file fields
							if (typeof fieldData[key] === 'string' && fieldData[key].includes('/storage/')) {
								return; // Skip file URLs
							}
							if (typeof fieldData[key] === 'object' && fieldData[key].filename) {
								return; // Skip file objects
							}
							
							if (Array.isArray(fieldData[key])) {
								// Handle arrays (checkboxes with potential 'other' option)
								const filteredArray = fieldData[key].filter((item: any) => {
									if (typeof item === 'string' && item.includes('/storage/')) {
										return false;
									}
									if (typeof item === 'object' && item.filename) {
										return false;
									}
									return true;
								});
								
								// Check if 'other' is selected and replace with custom text
								if (filteredArray.includes('other')) {
									const otherValue = fieldData[`${key}_other`];
									if (otherValue) {
										// Replace 'other' with the custom text
										const updatedArray = filteredArray.map((item: any) => 
											item === 'other' ? otherValue : item
										);
										value = updatedArray.join(', ');
									} else {
										value = filteredArray.join(', ');
									}
								} else {
									value = filteredArray.join(', ');
								}
							} else {
								// Handle single values (radio buttons, dropdowns)
								if (fieldData[key] === 'other') {
									// Check for the corresponding 'other' text field
									const otherValue = fieldData[`${key}_other`];
									value = otherValue ? String(otherValue) : 'other';
								} else {
									value = String(fieldData[key]);
								}
							}
						}
					});
				}
				row.push(value);
			});

			return row;
		});

		return { headers, rows };
	},

	convertToCSVString: (headers: string[], rows: any[][]): string => {
		// Helper function to escape CSV values
		const escapeCSVValue = (value: any): string => {
			const str = String(value || '');
			// If value contains comma, quote, or newline, wrap in quotes and escape quotes
			if (str.includes(',') || str.includes('"') || str.includes('\n')) {
				return `"${str.replace(/"/g, '""')}"`;
			}
			return str;
		};

		// Create CSV content
		const csvLines = [];
		
		// Add headers
		csvLines.push(headers.map(escapeCSVValue).join(','));
		
		// Add data rows
		rows.forEach(row => {
			csvLines.push(row.map(escapeCSVValue).join(','));
		});

		return csvLines.join('\n');
	},
};

export { StudentModel };
