import { Context } from "hono";
import * as jwt from "hono/jwt";
import { UserModel } from "@/model/user";
import { authPayload } from "@/types/payload";
import { ValidatePayload, ValidatorSchema } from "@/util/zod";
import { ErrorResponse, FailedResponse, SuccessResponse } from "@/util/response";

const UserController = {
	createAdmin: async (c: Context) => {
		try {
			const payload = await ValidatePayload<authPayload.Create>(
				c,
				ValidatorSchema.AuthPayload.create
			);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			if (await UserModel.getByUsername(payload.data.username))
				return c.json(...FailedResponse("ชื่อผู้ใช้นี้มีอยู่แล้ว"));

			const hashed = Bun.password.hashSync(payload.data.password);

			const newUser = await UserModel.createAdmin({ ...payload.data, password: hashed });

			// Remove password from response for security
			const { password, ...userResponse } = newUser.toObject();

			return c.json(...SuccessResponse("สร้างผู้ดูแลระบบสำเร็จ!", userResponse));
		} catch (e) {
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},
	createMaintainer: async (c: Context) => {
		try {
			const payload = await ValidatePayload<authPayload.Create>(
				c,
				ValidatorSchema.AuthPayload.create
			);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			if (await UserModel.getByUsername(payload.data.username))
				return c.json(...FailedResponse("ชื่อผู้ใช้นี้มีอยู่แล้ว"));

			const hashed = Bun.password.hashSync(payload.data.password);

			const newUser = await UserModel.createMaintainer({ ...payload.data, password: hashed });

			// Remove password from response for security
			const { password, ...userResponse } = newUser.toObject();

			return c.json(...SuccessResponse("สร้างผู้ดูแลข้อมูลสำเร็จ!", userResponse));
		} catch (e) {
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},
	createUser: async (c: Context) => {
		try {
			const role = c.req.param("role");
			const isCreateByAdmin = c.req.query("admin");

			if (role !== "admin" && role !== "maintainer") {
				return c.json(...FailedResponse("ชนิดผู้ใช้ไม่ถูกต้อง"));
			}

			const schema = isCreateByAdmin
				? ValidatorSchema.AuthPayload.createByAdmin
				: ValidatorSchema.AuthPayload.create;

			const payload = await ValidatePayload<authPayload.Create>(c, schema);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			if (await UserModel.getByUsername(payload.data.username))
				return c.json(...FailedResponse("ชื่อผู้ใช้นี้มีอยู่แล้ว"));

			// Generate password if created by admin, otherwise use payload password
			const generatedPassword = isCreateByAdmin
				? Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)
				: null;

			const password = generatedPassword || payload.data.password;
			const hashed = Bun.password.hashSync(password);

			const newUser =
				role === "admin"
					? await UserModel.createAdmin({ ...payload.data, password: hashed })
					: await UserModel.createMaintainer({ ...payload.data, password: hashed });

			// Remove password from response
			const { password: _, ...userResponse } = newUser.toObject();

			const responseMessage =
				role === "admin" ? "สร้างผู้ดูแลระบบสำเร็จ!" : "สร้างผู้ดูแลข้อมูลสำเร็จ!";

			// Include generated password in response if created by admin
			const responseData = isCreateByAdmin
				? { ...userResponse, generatedPassword }
				: userResponse;

			return c.json(...SuccessResponse(responseMessage, responseData));
		} catch (e) {
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},
	login: async (c: Context) => {
		try {
			const payload = await ValidatePayload<authPayload.Login>(
				c,
				ValidatorSchema.AuthPayload.login
			);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			const user = await UserModel.getByUsername(payload.data.username);

			if (user === null) return c.json(...FailedResponse("ไม่พบผู้ใช้งาน"));

			if (!Bun.password.verifySync(payload.data.password, user.password))
				return c.json(...FailedResponse("รหัสผ่านไม่ถูกต้อง", 410));

			const jwtData = {
				id: user.id,
			};

			const jwt_secret = Bun.env.JWT_SECRET;

			if (!jwt_secret) throw new Error("JWT_SECRET is not defined");

			const Token = await jwt.sign(jwtData, jwt_secret);

			return c.json(
				...SuccessResponse("เข้าสู่ระบบสำเร็จ", {
					role: user.role,
					token: Token,
					name: user.firstname,
					username: user.username,
				})
			);
		} catch (e) {
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},
	verify: async (c: Context) => {
		try {
			const user = c.get("user");

			if (!user) {
				return c.json(...FailedResponse("ไม่พบข้อมูลผู้ใช้งาน"));
			}

			return c.json(
				...SuccessResponse("ตรวจสอบผู้ใช้งานสำเร็จ", {
					id: user.id,
					name: user.firstname,
					role: user.role,
					is_first_time: user.is_first_time,
				})
			);
		} catch (e) {
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},
	changePassword: async (c: Context) => {
		try {
			const user = c.get("user");

			if (!user) {
				return c.json(...FailedResponse("ไม่พบข้อมูลผู้ใช้งาน"));
			}

			const payload = await ValidatePayload<authPayload.ChangePassword>(
				c,
				ValidatorSchema.AuthPayload.changePassword
			);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			const userRecord = await UserModel.getById(user.id);

			if (!userRecord) {
				return c.json(...FailedResponse("ไม่พบผู้ใช้งาน"));
			}

			if (
				!userRecord.is_first_time &&
				!Bun.password.verifySync(payload.data.current_password, userRecord.password)
			) {
				return c.json(...FailedResponse("รหัสผ่านปัจจุบันไม่ถูกต้อง", 410));
			}

			const hashedNewPassword = Bun.password.hashSync(payload.data.new_password);
			await UserModel.updatePassword(user.id, hashedNewPassword);

			return c.json(...SuccessResponse("เปลี่ยนรหัสผ่านสำเร็จ!"));
		} catch (e) {
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},
	getAllUsers: async (c: Context) => {
		try {
			const users = await UserModel.getAll();

			return c.json(...SuccessResponse("ดึงข้อมูลผู้ใช้งานทั้งหมดสำเร็จ", users));
		} catch (e) {
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},
	deleteUser: async (c: Context) => {
		try {
			const id = c.req.param("id");

			if (!id) return c.json(...FailedResponse("ไม่พบ ID ผู้ใช้งาน"));

			const currentUser = c.get("user");

			if (!currentUser) {
				return c.json(...FailedResponse("ไม่พบข้อมูลผู้ใช้งาน"));
			}

			// Prevent admin from deleting themselves
			if (currentUser.id === id) {
				return c.json(...FailedResponse("ไม่สามารถลบบัญชีของตนเองได้"));
			}

			const deletedUser = await UserModel.delete(id);

			if (!deletedUser) return c.json(...FailedResponse("ไม่พบผู้ใช้งาน", 404));

			return c.json(
				...SuccessResponse("ลบผู้ใช้งานสำเร็จ!", {
					id: deletedUser.id,
					username: deletedUser.username,
					firstname: deletedUser.firstname,
					lastname: deletedUser.lastname,
				})
			);
		} catch (e) {
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},
	changeUserRole: async (c: Context) => {
		try {
			const id = c.req.param("id");

			if (!id) return c.json(...FailedResponse("ไม่พบ ID ผู้ใช้งาน"));

			const currentUser = c.get("user");

			if (!currentUser) {
				return c.json(...FailedResponse("ไม่พบข้อมูลผู้ใช้งาน"));
			}

			// Prevent admin from changing their own role
			if (currentUser.id === id) {
				return c.json(...FailedResponse("ไม่สามารถเปลี่ยนบทบาทของตนเองได้"));
			}

			const payload = await ValidatePayload<authPayload.ChangeRole>(
				c,
				ValidatorSchema.AuthPayload.changeRole
			);

			if (!payload.success) return c.json(...FailedResponse(payload.error));

			const updatedUser = await UserModel.updateRole(id, payload.data.role);

			if (!updatedUser) return c.json(...FailedResponse("ไม่พบผู้ใช้งาน", 404));

			return c.json(...SuccessResponse("เปลี่ยนบทบาทผู้ใช้งานสำเร็จ!", updatedUser));
		} catch (e) {
			console.error(e);

			return c.json(...ErrorResponse(e));
		}
	},
};

export { UserController };
