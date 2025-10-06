"use client";
import { AuthFormFields } from "@/components/auth/formFields";
import { AuthWrapper } from "@/components/authWrapper";
import { HomeLayout } from "@/components/layouts/homeLayout";
import { Modal } from "@/components/modal";
import { UserType } from "@/types/user";
import { Axios } from "@/util/axios";
import { FC, useState } from "react";
import { useRouter } from "next/navigation";

type FormObject = {
	value: string;
	error: string | null;
};

type NewUserFormType = {
	username: FormObject;
	firstname: FormObject;
	lastname: FormObject;
};

const initialFormData: NewUserFormType = {
	username: { value: "", error: null },
	firstname: { value: "", error: null },
	lastname: { value: "", error: null },
};

const NewUserPage: FC = () => {
	const [formData, setFormData] = useState<NewUserFormType>(initialFormData);
	const [selectedRole, setSelectedRole] = useState<UserType.role>("maintainer");
	const [isLoading, setIsLoading] = useState(false);
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
	const [initialPassword, setInitialPassword] = useState<string>("");
	const [hasConfirmedSave, setHasConfirmedSave] = useState(false);
	const router = useRouter();

	const handleInputChange =
		(field: keyof NewUserFormType) => (e: React.ChangeEvent<HTMLInputElement>) => {
			setFormData((prev) => ({
				...prev,
				[field]: {
					...prev[field],
					value: e.target.value,
					error: null,
				},
			}));
		};

	const handleRoleSelect = (role: UserType.role) => {
		setSelectedRole(role);
	};

	const validateForm = (): boolean => {
		let isValid = true;
		const newFormData = { ...formData };

		if (!formData.username.value.trim()) {
			newFormData.username.error = "กรุณากรอกชื่อบัญชีผู้ใช้";
			isValid = false;
		}

		if (!formData.firstname.value.trim()) {
			newFormData.firstname.error = "กรุณากรอกชื่อจริง";
			isValid = false;
		}

		if (!formData.lastname.value.trim()) {
			newFormData.lastname.error = "กรุณากรอกนามสกุล";
			isValid = false;
		}

		setFormData(newFormData);
		return isValid;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsConfirmModalOpen(true);
	};

	const handleConfirmCreate = async () => {
		setIsConfirmModalOpen(false);
		setIsLoading(true);

		try {
			const response = await Axios.post(`/auth/${selectedRole}?admin=true`, {
				username: formData.username.value,
				firstname: formData.firstname.value,
				lastname: formData.lastname.value,
				role: selectedRole,
			});

			setInitialPassword(response.data.data.generatedPassword);

			if (response.status === 200 && response.data.success) {
				setIsSuccessModalOpen(true);
			} else {
				setFormData((prev) => ({
					...prev,
					username: {
						...prev.username,
						error: response.data.msg || "เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้",
					},
				}));
			}
		} catch (error: any) {
			console.error("Error creating user:", error);
			const errorMessage = error.response?.data?.msg || "เกิดข้อผิดพลาดในการเชื่อมต่อ";
			setFormData((prev) => ({
				...prev,
				username: { ...prev.username, error: errorMessage },
			}));
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancelCreate = () => {
		setIsConfirmModalOpen(false);
	};

	const handleSuccessClose = () => {
		if (!hasConfirmedSave) {
			return;
		}
		setIsSuccessModalOpen(false);
		setHasConfirmedSave(false);
		router.push("/admin");
	};

	return (
		<AuthWrapper requiredRole="admin">
			<main className="h-screen w-screen bg-gradient-to-b from-violet-gd0 to-violet-gd100 overflow-hidden">
				<div className="relative flex flex-col mt-24 w-[90%] mx-auto h-full pt-10">
					<h1 className="text-2xl font-semibold text-center mb-8">
						สร้างบัญชีผู้ใช้ใหม่
					</h1>

					<form
						onSubmit={handleSubmit}
						className="flex flex-col w-full items-center gap-2"
					>
						<AuthFormFields
							label="ชื่อบัญชีผู้ใช้"
							value={formData.username.value}
							onChange={handleInputChange("username")}
							error={formData.username.error}
						/>

						<AuthFormFields
							label="ชื่อจริง"
							value={formData.firstname.value}
							onChange={handleInputChange("firstname")}
							error={formData.firstname.error}
						/>

						<AuthFormFields
							label="นามสกุล"
							value={formData.lastname.value}
							onChange={handleInputChange("lastname")}
							error={formData.lastname.error}
						/>

						<div className="w-1/2">
							<label className="block text-md font-semibold mb-4">
								เลือกสิทธิของผู้ใช้
							</label>
							<div className="flex gap-4">
								<button
									type="button"
									onClick={() => handleRoleSelect("maintainer")}
									className={`flex-1 py-3 px-6 rounded-lg border-2 transition-colors ${
										selectedRole === "maintainer"
											? "bg-violet-2 border-violet-2 text-white"
											: "bg-transparent border-violet-2 text-violet-2"
									}`}
								>
									ผู้ใช้
								</button>
								<button
									type="button"
									onClick={() => handleRoleSelect("admin")}
									className={`flex-1 py-3 px-6 rounded-lg border-2 transition-colors ${
										selectedRole === "admin"
											? "bg-violet-2 border-violet-2 text-white"
											: "bg-transparent border-violet-2 text-violet-2"
									}`}
								>
									ผู้ดูแลระบบ
								</button>
							</div>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className={`mt-6 px-8 py-3 rounded-xl transition-colors ${
								isLoading
									? "bg-gray-400 cursor-not-allowed text-white"
									: "bg-violet-3 hover:bg-violet-4 text-white"
							}`}
						>
							{isLoading ? "กำลังสร้างบัญชี..." : "สร้างบัญชีผู้ใช้"}
						</button>
					</form>
				</div>

				{/* Confirmation Modal */}
				<Modal isOpen={isConfirmModalOpen} onClose={handleCancelCreate} size="sm">
					<div className="text-center py-4">
						<p className="text-black font-semibold text-lg mb-6">
							ยืนยันการสร้างบัญชีผู้ใช้ &ldquo;{formData.username.value}&rdquo;?
						</p>
						<div className="flex gap-4 justify-evenly">
							<button
								onClick={handleCancelCreate}
								className="px-6 py-2 bg-red w-[25%] text-white rounded-lg hover:bg-gray-50 transition-colors"
							>
								ยกเลิก
							</button>
							<button
								onClick={handleConfirmCreate}
								disabled={isLoading}
								className={`px-6 py-2 w-[25%] text-white rounded-lg transition-colors ${
									isLoading
										? "bg-gray-400 cursor-not-allowed"
										: "bg-green hover:bg-green-600"
								}`}
							>
								{isLoading ? "กำลังสร้าง..." : "ยืนยัน"}
							</button>
						</div>
					</div>
				</Modal>

				{/* Success Modal */}
				<Modal isOpen={isSuccessModalOpen} onClose={() => {}} size="md">
					<div className="text-center py-6">
						<p className="text-black font-semibold text-lg mb-4">
							สร้างบัญชีผู้ใช้สำเร็จ!
						</p>
						<div className="text-left bg-gray-100 p-4 rounded-lg mb-6">
							<p className="text-sm text-gray-700 mb-2">
								<strong>รหัสผ่านเริ่มต้น:</strong> {initialPassword}
							</p>
							<p className="text-sm text-gray-600">
								ผู้ใช้จะถูกบังคับให้เปลี่ยนรหัสผ่านในครั้งแรกที่เข้าสู่ระบบ
							</p>
						</div>
						<div className="flex items-center justify-center gap-3 mb-6">
							<input
								type="checkbox"
								id="confirmSave"
								checked={hasConfirmedSave}
								onChange={(e) => setHasConfirmedSave(e.target.checked)}
								className="w-5 h-5 text-violet-3 rounded focus:ring-violet-3"
							/>
							<label htmlFor="confirmSave" className="text-sm text-gray-800">
								ฉันได้บันทึกรหัสผ่านเรียบร้อยแล้ว
							</label>
						</div>
						<button
							onClick={handleSuccessClose}
							disabled={!hasConfirmedSave}
							className={`px-8 py-2 rounded-lg transition-colors ${
								hasConfirmedSave
									? "bg-violet-3 text-white hover:bg-violet-4"
									: "bg-grey text-gray-500 cursor-not-allowed"
							}`}
						>
							กลับไปหน้าจัดการผู้ใช้
						</button>
					</div>
				</Modal>
			</main>
		</AuthWrapper>
	);
};

export default NewUserPage;
