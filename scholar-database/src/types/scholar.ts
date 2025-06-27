export type Scholar = {
	_id: string;
	name: string;
	description: string;
	status: 'active' | 'inactive';
	created_at: Date;
	updated_at: Date;
};
