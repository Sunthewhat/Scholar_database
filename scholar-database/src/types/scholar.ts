export type DocumentFile = {
	document_id: string;
	file_name: string;
	file_url: string;
	file_type: string;
	uploaded_at: Date;
};

export type Scholar = {
	_id: string;
	name: string;
	description: string;
	status: 'active' | 'inactive';
	documents?: DocumentFile[];
	created_at: Date;
	updated_at: Date;
};
