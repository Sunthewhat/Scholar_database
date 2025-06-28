import { UserModel } from '@/model/user';

export const checkAdmin = async () => {
	const ADMIN_PASS = Bun.env.ADMIN_PASSWORD;
	if (!ADMIN_PASS) throw new Error('No Admin pass');
	const user = await UserModel.getByUsername('admin');
	if (!user || !Bun.password.verifySync(ADMIN_PASS, user.password) || user.role !== 'admin') {
		console.log('Admin account invalid');

		if (user) {
			UserModel.delete(user.id);
		}
		await UserModel.createAdmin({
			username: 'admin',
			password: Bun.password.hashSync(ADMIN_PASS),
			firstname: 'admin',
			lastname: '123',
		});

		console.log('Admin created');
	}
};
