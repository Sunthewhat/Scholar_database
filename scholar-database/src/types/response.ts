import { Scholar } from './scholar';
import { ScholarField } from './scholarField';
import { Student } from './student';
import { UserType } from './user';

type BaseResponse<T> = {
	success: boolean;
	msg: string;
	data: T;
};

export namespace AuthResponse {
	export type login = BaseResponse<UserType.login>;
	export type verify = BaseResponse<UserType.verify>;
	export type changePassword = BaseResponse<null>;
	export type getUsers = BaseResponse<UserType.getUsers>;
}

export namespace ScholarResponse {
	export type getAll = BaseResponse<Scholar[]>;
	export type getById = BaseResponse<Scholar>;
	export type create = BaseResponse<Scholar>;
	export type update = BaseResponse<Scholar>;
	export type deleteScholar = BaseResponse<null>;
}

export namespace ScholarFieldResponse {
	export type create = BaseResponse<ScholarField>;
	export type getAll = BaseResponse<ScholarField[]>;
	export type getById = BaseResponse<ScholarField>;
	export type update = BaseResponse<ScholarField>;
	export type deleteField = BaseResponse<null>;
}

export namespace StudentResponse {
	export type create = BaseResponse<Student>;
	export type getAll = BaseResponse<Student[]>;
	export type getById = BaseResponse<Student>;
	export type getByScholar = BaseResponse<Student[]>;
	export type update = BaseResponse<Student>;
	export type deleteStudent = BaseResponse<null>;
	export type submitForm = BaseResponse<Student>;
	export type getCount = BaseResponse<{ count: number }>;
}
