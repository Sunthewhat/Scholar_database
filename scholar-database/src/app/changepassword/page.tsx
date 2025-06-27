'use client';
import { AuthWrapper } from '@/components/authWrapper';
import { AuthFormFields } from '@/components/auth/formFields';
import { Modal } from '@/components/modal';
import { Axios } from '@/util/axios';
import { AuthResponse } from '@/types/response';
import { getCookieValue, setCookie } from '@/utils/cookie';
import { FC, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HomeLayout } from '@/components/layouts/homeLayout';

type FormObject = {
	value: string;
	error: string | null;
};

type ChangePasswordFormType = {
	currentPassword: FormObject;
	newPassword: FormObject;
	confirmPassword: FormObject;
};

const initialFormData: ChangePasswordFormType = {
	currentPassword: { value: '', error: null },
	newPassword: { value: '', error: null },
	confirmPassword: { value: '', error: null },
};

const ChangePasswordPage: FC = () => {
	const [formData, setFormData] = useState<ChangePasswordFormType>(initialFormData);
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
	const [isFirstTime, setIsFirstTime] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const firstTimeValue = getCookieValue('is_first_time');
		setIsFirstTime(firstTimeValue === 'true');
	}, []);

	const handleInputChange =
		(field: keyof ChangePasswordFormType) => (e: React.ChangeEvent<HTMLInputElement>) => {
			setFormData((prev) => ({
				...prev,
				[field]: {
					...prev[field],
					value: e.target.value,
					error: null,
				},
			}));
		};

	const validateForm = (): boolean => {
		let isValid = true;
		const newFormData = { ...formData };

		// Only validate current password if it's not first time login
		if (!isFirstTime && !formData.currentPassword.value.trim()) {
			newFormData.currentPassword.error = 'กรุณากรอกรหัสผ่านปัจจุบัน';
			isValid = false;
		}

		if (!formData.newPassword.value.trim()) {
			newFormData.newPassword.error = 'กรุณากรอกรหัสผ่านใหม่';
			isValid = false;
		} else if (formData.newPassword.value.length < 8) {
			newFormData.newPassword.error = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
			isValid = false;
		}

		if (!formData.confirmPassword.value.trim()) {
			newFormData.confirmPassword.error = 'กรุณายืนยันรหัสผ่านใหม่';
			isValid = false;
		} else if (formData.newPassword.value !== formData.confirmPassword.value) {
			newFormData.confirmPassword.error = 'รหัสผ่านใหม่ไม่ตรงกัน';
			isValid = false;
		}

		setFormData(newFormData);
		return isValid;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsLoading(true);

		try {
			// Use default password for first time login, otherwise use current password
			const currentPassword = isFirstTime ? 'zyxw4321' : formData.currentPassword.value;
			
			// API call to change password
			const response = await Axios.put<AuthResponse.changePassword>(
				'/auth/change-password',
				{
					current_password: currentPassword,
					new_password: formData.newPassword.value,
				}
			);

			if (response.status === 200 && response.data.success) {
				// Clear first time cookie if it was set
				if (isFirstTime) {
					setCookie('is_first_time', '', { 
						path: '/', 
						secure: true, 
						sameSite: 'strict',
						expires: new Date(0) // Expire immediately 
					});
				}
				
				// Reset form on success
				setFormData(initialFormData);
				setIsSuccessModalOpen(true);
			} else {
				// Handle unsuccessful response
				setFormData((prev) => ({
					...prev,
					currentPassword: {
						...prev.currentPassword,
						error: response.data.msg || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน',
					},
				}));
			}
		} catch (error: any) {
			console.error('Error changing password:', error);

			let errorMessage = 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน';
			let targetField = 'currentPassword';

			if (error.response) {
				const status = error.response.status;
				const message = error.response.data?.msg;

				switch (status) {
					case 400:
						errorMessage = message || 'ข้อมูลไม่ถูกต้องหรือไม่ครบถ้วน';
						break;
					case 410:
						errorMessage = message || 'รหัสผ่านปัจจุบันไม่ถูกต้อง';
						targetField = 'currentPassword';
						break;
					case 500:
						errorMessage = message || 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์';
						break;
					default:
						errorMessage = message || errorMessage;
				}
			}

			setFormData((prev) => ({
				...prev,
				[targetField]: {
					...prev[targetField as keyof ChangePasswordFormType],
					error: errorMessage,
				},
			}));
		} finally {
			setIsLoading(false);
		}
	};

	const handleSuccessConfirm = () => {
		setIsSuccessModalOpen(false);
		router.push('/');
	};

	return (
		<>
			<AuthWrapper requiredRole='maintainer'>
				<HomeLayout>
					<form
						className='h-full flex flex-col items-center justify-center'
						onSubmit={handleSubmit}
					>
						<h1 className='text-2xl font-semibold mb-8'>
							{isFirstTime ? 'ตั้งรหัสผ่านใหม่' : 'เปลี่ยนรหัสผ่าน'}
						</h1>

						{!isFirstTime && (
							<AuthFormFields
								label='รหัสผ่านปัจจุบัน'
								value={formData.currentPassword.value}
								onChange={handleInputChange('currentPassword')}
								error={formData.currentPassword.error}
								type='password'
								showPasswordToggle
							/>
						)}

						<AuthFormFields
							label='รหัสผ่านใหม่'
							value={formData.newPassword.value}
							onChange={handleInputChange('newPassword')}
							error={formData.newPassword.error}
							type='password'
							showPasswordToggle
						/>

						<AuthFormFields
							label='ยืนยันรหัสผ่านใหม่'
							value={formData.confirmPassword.value}
							onChange={handleInputChange('confirmPassword')}
							error={formData.confirmPassword.error}
							type='password'
							showPasswordToggle
						/>
						<div className='w-1/2 flex justify-end'>
							<button
								type='submit'
								disabled={isLoading}
								className={`mt-8 px-8 py-2 rounded-xl transition-colors ${
									isLoading
										? 'bg-gray-400 cursor-not-allowed text-white'
										: 'bg-violet-3 hover:bg-violet-4 text-white'
								}`}
							>
								{isLoading ? (isFirstTime ? 'กำลังตั้ง...' : 'กำลังเปลี่ยน...') : 'ยืนยัน'}
							</button>
						</div>
					</form>
				</HomeLayout>
			</AuthWrapper>
			{/* Success Modal */}
			<Modal isOpen={isSuccessModalOpen} onClose={handleSuccessConfirm} size='sm'>
				<div className='text-center py-4'>
					<p className='text-black font-semibold text-lg mb-6'>
						{isFirstTime ? 'ตั้งรหัสผ่านสำเร็จ' : 'เปลี่ยนรหัสผ่านสำเร็จ'}
					</p>
					<button
						onClick={handleSuccessConfirm}
						className='px-6 py-2 bg-violet-3 text-white rounded-lg hover:bg-violet-4 transition-colors'
					>
						ยืนยัน
					</button>
				</div>
			</Modal>
		</>
	);
};

export default ChangePasswordPage;
