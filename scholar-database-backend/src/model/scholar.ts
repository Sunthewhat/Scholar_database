import * as mongoose from 'mongoose';

type DocumentFile = {
	document_id: string;
	file_name: string;
	file_url: string;
	file_type: string;
	uploaded_at: Date;
};

type ScholarType = {
	name: string;
	description: string;
	status: 'active' | 'inactive';
	documents: DocumentFile[];
	created_at: Date;
	updated_at: Date;
};

const documentFileSchema = new mongoose.Schema(
	{
		document_id: { type: String, required: true },
		file_name: { type: String, required: true },
		file_url: { type: String, required: true },
		file_type: { type: String, required: true },
		uploaded_at: { type: Date, required: true, default: Date.now },
	},
	{ _id: false }
);

const scholarSchema = new mongoose.Schema<ScholarType>(
	{
		name: { type: String, required: true },
		description: { type: String, required: true },
		status: { type: String, enum: ['active', 'inactive'], required: true, default: 'active' },
		documents: { type: [documentFileSchema], default: [] },
		created_at: { type: Date, required: true, default: new Date() },
		updated_at: { type: Date, required: true, default: new Date() },
	},
	{ strict: true }
);

export type Scholar = mongoose.InferSchemaType<typeof scholarSchema>;
export const Scholar = mongoose.model('Scholar', scholarSchema);

const ScholarModel = {
	create: async (s: Omit<Scholar, 'created_at' | 'updated_at' | 'status'>) => {
		return await new Scholar(s).save();
	},
	getAll: async () => {
		return await Scholar.find();
	},
	getById: async (id: string) => {
		return await Scholar.findById(id);
	},
	getActive: async () => {
		return await Scholar.find({ status: 'active' });
	},
	update: async (id: string, data: Partial<Omit<Scholar, '_id' | 'created_at'>>) => {
		return await Scholar.findByIdAndUpdate(
			id,
			{ ...data, updated_at: new Date() },
			{ new: true }
		);
	},
	delete: async (id: string) => {
		return await Scholar.findByIdAndDelete(id);
	},
	setStatus: async (id: string, status: 'active' | 'inactive') => {
		return await Scholar.findByIdAndUpdate(
			id,
			{ status, updated_at: new Date() },
			{ new: true }
		);
	},
	addDocument: async (id: string, document: DocumentFile) => {
		return await Scholar.findByIdAndUpdate(
			id,
			{
				$push: { documents: document },
				updated_at: new Date()
			},
			{ new: true }
		);
	},
	deleteDocument: async (id: string, documentId: string) => {
		return await Scholar.findByIdAndUpdate(
			id,
			{
				$pull: { documents: { document_id: documentId } },
				updated_at: new Date()
			},
			{ new: true }
		);
	},
	getDocuments: async (id: string) => {
		const scholar = await Scholar.findById(id);
		return scholar?.documents || [];
	},
};

export { ScholarModel };
export type { DocumentFile };
