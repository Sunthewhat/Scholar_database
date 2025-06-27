'use client';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Modal } from '@/components/modal';
import { getCookieValue, clearAuthCookies } from '@/utils/cookie';
import { FC, useEffect, useState } from 'react';

const NavBar: FC = () => {
	const [userName, setUserName] = useState<string>('');
	const [userRole, setUserRole] = useState<string>('');
	const [searchType, setSearchType] = useState<'name' | 'keyword'>('name');
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
	const navigator = useRouter();

	const path = usePathname();

	useEffect(() => {
		setUserName(getCookieValue('userName'));
		setUserRole(getCookieValue('userRole'));
	}, []);

	const handleLogoutClick = () => {
		setIsDropdownOpen(false);
		setIsLogoutModalOpen(true);
	};

	const handleLogoutConfirm = () => {
		// Clear cookies
		clearAuthCookies();

		// Redirect to login
		window.location.href = '/login';
	};

	const handleLogoutCancel = () => {
		setIsLogoutModalOpen(false);
	};

	const toggleDropdown = () => {
		setIsDropdownOpen(!isDropdownOpen);
	};

	const closeDropdown = () => {
		setIsDropdownOpen(false);
	};

	const handleChangePassword = () => {
		setIsDropdownOpen(false);
		navigator.push('/changepassword');
	};

	const handleAdmin = () => {
		setIsDropdownOpen(false);
		navigator.push('/admin');
	};

	return (
		<nav className='fixed w-full top-0 left-0 h-20 flex items-center justify-between px-10 z-20 mt-4'>
			<Image
				src='/assets/logo.svg'
				alt='logo'
				className='w-[7%] h-16'
				width={70}
				height={70}
				onClick={() => navigator.push('/')}
				priority
			/>
			{path === '/' && (
				<div className='flex items-center gap-4 w-[80%]'>
					<div className='relative flex items-center w-[80%]'>
						<input
							className='w-full px-4 py-2 pr-10 rounded-full shadow-md'
							placeholder='ค้นหา...'
						/>
						<Image
							src='/assets/search.svg'
							alt='search'
							className='absolute right-3 w-5 h-5 cursor-pointer'
							width={16}
							height={16}
						/>
					</div>
					<div className='flex gap-1 flex-col w-[20%] text-violet-3'>
						<label className='flex items-center gap-2 cursor-pointer'>
							<input
								type='radio'
								name='searchType'
								value='name'
								checked={searchType === 'name'}
								onChange={(e) =>
									setSearchType(e.target.value as 'name' | 'keyword')
								}
								className='accent-violet-3'
							/>
							<span className='text-sm'>ค้นหาจากชื่อทุน</span>
						</label>
						<label className='flex items-center gap-2 cursor-pointer'>
							<input
								type='radio'
								name='searchType'
								value='keyword'
								checked={searchType === 'keyword'}
								onChange={(e) =>
									setSearchType(e.target.value as 'name' | 'keyword')
								}
								className='accent-violet-3'
							/>
							<span className='text-sm'>ค้นหาจากคำที่เกี่ยวข้อง</span>
						</label>
					</div>
				</div>
			)}
			<div className='relative w-[13%]'>
				<button
					onClick={toggleDropdown}
					className='flex w-full max-w-48 items-center gap-2 bg-white border-violet-3 border-[2px] rounded-full px-6 py-2'
				>
					<Image
						src='/assets/user.svg'
						alt='user'
						className='w-5'
						width={10}
						height={10}
					/>
					<h1 className='text-md text-violet-3 font-semibold font-sans text-ellipsis w-5/6 overflow-hidden'>
						{userName}
					</h1>
				</button>

				{/* Dropdown Menu */}
				{isDropdownOpen && (
					<div className='absolute right-0 mt-2 w-48 bg-white border-violet-3 border-[2px] rounded-lg shadow-lg z-30'>
						<div className='font-semibold'>
							<button
								onClick={handleChangePassword}
								className='w-full px-4 py-2 text-violet-3 hover:bg-gray-100 transition-colors'
							>
								เปลี่ยนรหัสผ่าน
							</button>
							<div className='border-t-[2px] border-violet-3 w-full'></div>
							{userRole === 'admin' && (
								<>
									<button
										onClick={handleAdmin}
										className='w-full px-4 py-2 text-violet-3 hover:bg-gray-100 transition-colors'
									>
										จัดการบัญชีผู้ใช้
									</button>
									<div className='border-t-[2px] border-violet-3 w-full'></div>
								</>
							)}
							<button
								onClick={handleLogoutClick}
								className='w-full px-4 py-2 text-violet-3 hover:bg-gray-100 transition-colors'
							>
								ออกจากระบบ
							</button>
						</div>
					</div>
				)}

				{/* Backdrop to close dropdown */}
				{isDropdownOpen && <div className='fixed inset-0 z-10' onClick={closeDropdown} />}
			</div>

			{/* Logout Confirmation Modal */}
			<Modal isOpen={isLogoutModalOpen} onClose={handleLogoutCancel} size='sm'>
				<div className='text-center py-4'>
					<p className='text-black font-semibold text-lg mb-6'>ยืนยันการออกจากระบบ?</p>
					<div className='flex gap-4 justify-evenly'>
						<button
							onClick={handleLogoutCancel}
							className='px-6 py-2 bg-red w-[25%] text-white rounded-lg hover:bg-gray-50 transition-colors'
						>
							ยกเลิก
						</button>
						<button
							onClick={handleLogoutConfirm}
							className='px-6 py-2 bg-green w-[25%] text-white rounded-lg hover:bg-red-600 transition-colors'
						>
							ยืนยัน
						</button>
					</div>
				</div>
			</Modal>
		</nav>
	);
};

export { NavBar };
