import * as mongoose from 'mongoose';

type ScholarType = {
	name: string;
	description: string;
	status: 'active' | 'inactive';
	created_at: Date;
	updated_at: Date;
};

const scholarSchema = new mongoose.Schema<ScholarType>(
	{
		name: { type: String, required: true },
		description: { type: String, required: true },
		status: { type: String, enum: ['active', 'inactive'], required: true, default: 'active' },
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
};

export { ScholarModel };
