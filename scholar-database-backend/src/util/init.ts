import { UserModel } from '@/model/user';

export const checkAdmin = async () => {
	const ADMIN_PASS = Bun.env.ADMIN_PASSWORD;
	if (!ADMIN_PASS) throw new Error('No Admin pass');
	const user = await UserModel.getByUsername('admin');
	if (user) {
		await UserModel.delete(user.id);
	}
	await UserModel.createAdmin(
		{
			username: 'admin',
			password: Bun.password.hashSync(ADMIN_PASS),
			firstname: 'admin',
			lastname: '123',
		},
		true
	);

	console.log('Admin created');
};
