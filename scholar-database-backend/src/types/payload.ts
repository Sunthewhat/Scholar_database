namespace authPayload {
	export type Login = {
		username: string;
		password: string;
	};
	export type Create = {
		username: string;
		password: string;
		firstname: string;
		lastname: string;
	};
	export type ChangePassword = {
		current_password: string;
		new_password: string;
	};
	export type ChangeRole = {
		role: 'admin' | 'maintainer';
	};
}

namespace scholarPayload {
	export type Create = {
		name: string;
		description: string;
	};
	export type Update = {
		name?: string;
		description?: string;
		status?: 'active' | 'inactive';
	};
}

namespace scholarFieldPayload {
	export type QuestionType = 'short_answer' | 'long_answer' | 'radio' | 'checkbox' | 'dropdown' | 'table' | 'date' | 'time' | 'file_upload';
	
	export type ValidationRule = {
		min_length?: number;
		max_length?: number;
		required_files?: number;
		max_file_size?: number;
		allowed_extensions?: string[];
		min_date?: Date;
		max_date?: Date;
	};

	export type TableConfig = {
		rows: number;
		columns: number;
		row_labels?: string[];
		column_labels?: string[];
	};

	export type Question = {
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

	export type CreateField = {
		scholar_id: string;
		field_name: string;
		field_label: string;
		field_description?: string;
		order: number;
		questions: Question[];
	};

	export type UpdateField = {
		field_name?: string;
		field_label?: string;
		field_description?: string;
		order?: number;
		questions?: Question[];
	};

	export type CreateQuestion = Question;

	export type UpdateQuestion = Partial<Question>;

	export type ReorderFields = {
		scholar_id: string;
		field_orders: { id: string; order: number }[];
	};

	export type ReorderQuestions = {
		field_id: string;
		question_orders: { question_id: string; order: number }[];
	};
}

namespace studentPayload {
	export type Create = {
		scholar_id: string;
		form_data?: Record<string, any>;
	};

	export type Update = {
		form_data?: Record<string, any>;
		status?: 'incomplete' | 'completed';
		fullname?: string;
	};

	export type SubmitForm = {
		form_data: Record<string, any>;
	};

	export type GenerateTempPermission = {
		student_id: string;
		expires_in?: number;
	};

	export type VerifyTempPermission = {
		token: string;
		student_id: string;
	};
}

export { authPayload, scholarPayload, scholarFieldPayload, studentPayload };
