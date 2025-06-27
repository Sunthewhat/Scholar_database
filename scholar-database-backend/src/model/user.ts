import * as mongoose from 'mongoose';

type UserType = {
	username: string;
	password: string;
	firstname: string;
	lastname: string;
	role: 'admin' | 'maintainer';
	created_at: Date;
	is_first_time: boolean;
};

const userSchema = new mongoose.Schema<UserType>(
	{
		username: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		role: { type: String, enum: ['admin', 'maintainer'], required: true },
		firstname: { type: String, required: true },
		lastname: { type: String, required: true },
		created_at: { type: Date, required: true, default: new Date() },
		is_first_time: { type: Boolean, required: true, default: true },
	},
	{ strict: true }
);

export type User = mongoose.InferSchemaType<typeof userSchema>;
export const User = mongoose.model('User', userSchema);

const UserModel = {
	createAdmin: async (u: Omit<User, 'created_at' | 'role' | 'is_first_time'>) => {
		return await new User({ ...u, role: 'admin' }).save();
	},
	createMaintainer: async (u: Omit<User, 'created_at' | 'role' | 'is_first_time'>) => {
		return await new User({ ...u, role: 'maintainer' }).save();
	},
	getByUsername: async (username: string) => {
		return await User.findOne({ username });
	},
	getById: async (id: string) => {
		return await User.findById(id);
	},
	updatePassword: async (id: string, newPassword: string) => {
		return await User.findByIdAndUpdate(
			id,
			{ password: newPassword, is_first_time: false },
			{ new: true }
		);
	},
	getAll: async () => {
		return await User.find().select('-password');
	},
	delete: async (id: string) => {
		return await User.findByIdAndDelete(id);
	},
	updateRole: async (id: string, role: 'admin' | 'maintainer') => {
		return await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
	},
};
export { UserModel };
