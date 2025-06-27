'use client';
import { FC, ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Axios } from '@/util/axios';
import { AuthResponse } from '@/types/response';
import { getCookieValue, clearAuthCookies, setCookie } from '@/utils/cookie';

type AuthWrapperProps = {
	children: ReactNode;
	requiredRole?: 'admin' | 'maintainer';
};

const AuthWrapper: FC<AuthWrapperProps> = ({ children, requiredRole }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [hasPermission, setHasPermission] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const verifyAuth = async () => {
			try {
				setIsLoading(true);

				// Get token from cookies
				const token = getCookieValue('authToken');

				if (!token) {
					// No token, redirect to login
					router.push('/login');
					return;
				}

				// Verify token with API
				const response = await Axios.get<AuthResponse.verify>('/auth/verify');

				if (response.status === 200 && response.data.success) {
					setIsAuthenticated(true);

					if (response.data.data.is_first_time) {
						handleFirstTime();
					}

					// Check role-based access
					const userRole = response.data.data.role;

					if (!requiredRole) {
						// No role requirement, allow access
						setHasPermission(true);
					} else if (requiredRole === 'maintainer') {
						// Maintainer level: both admin and maintainer can access
						setHasPermission(userRole === 'admin' || userRole === 'maintainer');
					} else if (requiredRole === 'admin') {
						// Admin level: only admin can access
						setHasPermission(userRole === 'admin');
					}
				} else {
					// Invalid token, redirect to login
					clearCookiesAndRedirect();
				}
			} catch (error) {
				console.error('Auth verification error:', error);
				// Auth failed, redirect to login
				clearCookiesAndRedirect();
			} finally {
				setIsLoading(false);
			}
		};

		const clearCookiesAndRedirect = () => {
			// Clear all auth cookies
			clearAuthCookies();

			// Redirect to login
			router.push('/login');
		};

		const handleFirstTime = () => {
			setCookie('is_first_time', 'true', {
				path: '/',
				secure: true,
				sameSite: 'strict',
			});
			router.push('/changepassword');
		};

		verifyAuth();
	}, [router, requiredRole]);

	// Loading state
	if (isLoading) {
		return (
			<div className='h-screen w-screen flex items-center justify-center bg-gradient-to-b from-violet-gd0 to-violet-gd100'>
				<div className='text-2xl text-white font-semibold'>กำลังตรวจสอบสิทธิ์...</div>
			</div>
		);
	}

	// Not authenticated
	if (!isAuthenticated) {
		return null; // Will redirect to login
	}

	// Authenticated but no permission
	if (!hasPermission) {
		return (
			<div className='h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-b from-violet-gd0 to-violet-gd100'>
				<div className='text-2xl text-white font-semibold mb-4'>ไม่มีสิทธิ์เข้าถึง</div>
				<div className='text-lg text-white mb-6'>คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้</div>
				<button
					onClick={() => router.back()}
					className='px-6 py-2 bg-white text-violet-3 rounded-lg hover:bg-gray-100 transition-colors'
				>
					กลับ
				</button>
			</div>
		);
	}

	// Authenticated and has permission
	return <>{children}</>;
};

export { AuthWrapper };
