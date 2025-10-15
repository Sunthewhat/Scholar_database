import { Scholar } from './scholar';

export type StudentStatus = 'completed' | 'incomplete';

export type Student = {
	_id?: string;
	scholar_id: string | Scholar; // Can be string ID or populated Scholar object
	form_data: Record<string, any>;
	status: StudentStatus;
	fullname: string;
	profile_image?: string;
	submitted_at?: Date;
	created_at?: Date;
	updated_at?: Date;
};

export type CreateStudentPayload = {
	scholar_id: string;
	form_data?: Record<string, any>;
};

export type UpdateStudentPayload = {
	form_data?: Record<string, any>;
	status?: StudentStatus;
};

export type SubmitFormPayload = {
	form_data: Record<string, any>;
};
