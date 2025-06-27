export namespace UserType {
	export type role = 'admin' | 'maintainer';
	export type login = {
		role: role;
		token: string;
		name: string;
		username: string;
	};
	export type verify = {
		role: role;
		name: string;
		id: string;
		is_first_time: boolean;
	};

	export type getUsers = {
		_id: string;
		username: string;
		role: role;
		firstname: string;
		lastname: string;
		created_at: Date;
		is_first_time: boolean;
	}[];
}
