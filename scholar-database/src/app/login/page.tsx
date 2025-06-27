'use client';

import { AuthFormFields } from '@/components/auth/formFields';
import { AuthLayout } from '@/components/layouts/authLayout';
import { Axios } from '@/util/axios';
import { AuthResponse } from '@/types/response';
import { setCookie } from '@/utils/cookie';
import { FC, useState } from 'react';
import { useRouter } from 'next/navigation';

type FormObject = {
	value: string;
	error: string | null;
};

type LoginFormType = {
	username: FormObject;
	password: FormObject;
};

const initialFormData: LoginFormType = {
	username: { value: '', error: null },
	password: { value: '', error: null },
};

const LoginPage: FC = () => {
	const [formData, setFormData] = useState<LoginFormType>(initialFormData);
	const [isLoading, setIsLoading] = useState(false);

	const navigator = useRouter();

	const handleInputChange =
		(field: keyof LoginFormType) => (e: React.ChangeEvent<HTMLInputElement>) => {
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

		if (!formData.username.value.trim()) {
			newFormData.username.error = 'กรุณากรอกชื่อบัญชีผู้ใช้';
			isValid = false;
		}

		if (!formData.password.value.trim()) {
			newFormData.password.error = 'กรุณากรอกรหัสผ่าน';
			isValid = false;
		}

		setFormData(newFormData);
		return isValid;
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsLoading(true);

		try {
			const response = await Axios.post<AuthResponse.login>('/auth/login', {
				username: formData.username.value,
				password: formData.password.value,
			});

			if (response.status === 200 && response.data.success) {
				if (response.data.data.token) {
					setCookie('authToken', response.data.data.token, {
						path: '/',
						secure: true,
						sameSite: 'strict',
					});
					setCookie('userRole', response.data.data.role, {
						path: '/',
						secure: true,
						sameSite: 'strict',
					});
					setCookie('userName', response.data.data.name, {
						path: '/',
						secure: true,
						sameSite: 'strict',
					});
					setCookie('username', response.data.data.username, {
						path: '/',
						secure: true,
						sameSite: 'strict',
					});
				}
				// You can add navigation here, e.g., router.push('/dashboard')
				navigator.push('/');
			} else {
				setFormData((prev) => {
					if (response.status === 410)
						return {
							...prev,
							password: {
								...prev.password,
								error: response.data.msg || 'เข้าสู่ระบบไม่สำเร็จ',
							},
						};
					return {
						...prev,
						username: {
							...prev.username,
							error: response.data.msg || 'เข้าสู่ระบบไม่สำเร็จ',
						},
					};
				});
			}
		} catch (error: any) {
			console.error('Login error:', error);
			const errorMessage = error.response?.data?.msg || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
			setFormData((prev) => ({
				...prev,
				username: { ...prev.username, error: errorMessage },
			}));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AuthLayout>
			<form
				className='h-full flex flex-col items-center justify-center'
				onSubmit={handleLogin}
			>
				<h1 className='text-2xl font-semibold'>เข้าสู่ระบบ</h1>
				<AuthFormFields
					label='ชื่อบัญชีผู้ใช้'
					value={formData.username.value}
					onChange={handleInputChange('username')}
					error={formData.username.error}
				/>
				<AuthFormFields
					label='รหัสผ่าน'
					value={formData.password.value}
					onChange={handleInputChange('password')}
					error={formData.password.error}
					type='password'
					showPasswordToggle={true}
				/>
				<button type='submit' disabled={isLoading} className='mt-10'>
					<h1 className='bg-violet-3 text-white px-8 py-2 rounded-xl'>
						{isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
					</h1>
				</button>
			</form>
		</AuthLayout>
	);
};

export default LoginPage;
