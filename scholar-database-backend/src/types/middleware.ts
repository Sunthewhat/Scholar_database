export type AuthMiddlewareSetValue = {
	id: string;
	username: string;
	firstname: string;
	lastname: string;
	role: 'admin' | 'maintainer';
	is_first_time: boolean;
};
