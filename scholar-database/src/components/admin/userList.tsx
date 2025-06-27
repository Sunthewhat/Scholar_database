/* eslint-disable react-hooks/exhaustive-deps */
import { UserType } from '@/types/user';
import { FC, useState, useEffect } from 'react';
import { useApiData } from '@/utils/api';
import { Modal } from '@/components/modal';
import Image from 'next/image';
import { getCookieValue } from '@/utils/cookie';

type UserListProps = {
	isEditing: boolean;
	handleDeleteUser: (id: string) => Promise<boolean>;
	handleUpdateUserRole: (id: string, newRole: UserType.role) => Promise<boolean>;
};

const UserList: FC<UserListProps> = ({ isEditing, handleDeleteUser, handleUpdateUserRole }) => {
	const {
		data: users,
		isLoading,
		isError,
		refetch: fetchUsers,
	} = useApiData<UserType.getUsers>('/auth/users');

	const username = getCookieValue('username');

	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
	const [userToDelete, setUserToDelete] = useState<UserType.getUsers[0] | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Role editing states
	const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
	const [isRoleConfirmModalOpen, setIsRoleConfirmModalOpen] = useState(false);
	const [isRoleSuccessModalOpen, setIsRoleSuccessModalOpen] = useState(false);
	const [roleChangeData, setRoleChangeData] = useState<{
		user: UserType.getUsers[0];
		newRole: UserType.role;
	} | null>(null);
	const [isUpdatingRole, setIsUpdatingRole] = useState(false);

	const handleDeleteClick = (user: UserType.getUsers[0]) => {
		setUserToDelete(user);
		setIsDeleteModalOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!userToDelete) return;

		try {
			setIsDeleting(true);
			const success = await handleDeleteUser(userToDelete._id);

			if (success) {
				setIsDeleteModalOpen(false);
				setUserToDelete(null);
				setIsSuccessModalOpen(true);
				fetchUsers(); // Refresh the user list
			}
		} catch (error) {
			console.error('Error in delete confirmation:', error);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleDeleteCancel = () => {
		setIsDeleteModalOpen(false);
		setUserToDelete(null);
	};

	const handleSuccessModalClose = () => {
		setIsSuccessModalOpen(false);
	};

	// Role change handlers
	const handleRoleDropdownToggle = (userId: string) => {
		setOpenDropdownId(openDropdownId === userId ? null : userId);
	};

	const handleRoleChangeClick = (user: UserType.getUsers[0], newRole: UserType.role) => {
		setRoleChangeData({ user, newRole });
		setOpenDropdownId(null);
		setIsRoleConfirmModalOpen(true);
	};

	const handleRoleChangeConfirm = async () => {
		if (!roleChangeData) return;

		try {
			setIsUpdatingRole(true);
			const success = await handleUpdateUserRole(
				roleChangeData.user._id,
				roleChangeData.newRole
			);

			if (success) {
				setIsRoleConfirmModalOpen(false);
				setRoleChangeData(null);
				setIsRoleSuccessModalOpen(true);
				fetchUsers(); // Refresh the user list
			}
		} catch (error) {
			console.error('Error in role change confirmation:', error);
		} finally {
			setIsUpdatingRole(false);
		}
	};

	const handleRoleChangeCancel = () => {
		setIsRoleConfirmModalOpen(false);
		setRoleChangeData(null);
	};

	const handleRoleSuccessModalClose = () => {
		setIsRoleSuccessModalOpen(false);
	};

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Element;
			if (
				openDropdownId &&
				!target.closest(`#role-button-${openDropdownId}`) &&
				!target.closest('.role-dropdown')
			) {
				setOpenDropdownId(null);
			}
		};

		if (openDropdownId) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [openDropdownId]);

	if (isLoading) {
		return (
			<div className='flex justify-center items-center h-40'>
				<div className='text-lg text-gray-600'>กำลังโหลด...</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className='flex flex-col items-center justify-center h-40 gap-4'>
				<div className='text-lg text-red-500'>เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
				<button
					onClick={fetchUsers}
					className='px-4 py-2 bg-violet-3 text-white rounded-lg hover:bg-violet-4 transition-colors'
				>
					ลองใหม่
				</button>
			</div>
		);
	}

	if (!users || users.length === 0) {
		return (
			<div className='flex justify-center items-center h-40'>
				<div className='text-lg text-gray-600'>ไม่มีข้อมูลผู้ใช้</div>
			</div>
		);
	}

	return (
		<>
			<div className='w-full flex flex-col'>
				{users.map((user) => (
					<div
						key={user._id}
						className='w-full mt-4 bg-white h-16 grid grid-cols-3 rounded-2xl text-black text-xl text-center items-center relative'
					>
						<div className='col-span-2 text-left ml-8 flex justify-between items-center'>
							<div className='flex flex-col justify-center flex-1 min-w-0 pr-4'>
								<h3 className='text-black text-base text-ellipsis overflow-hidden whitespace-nowrap'>
									{user.firstname} {user.lastname}
								</h3>
								<p className='text-gray-600 text-sm text-ellipsis overflow-hidden whitespace-nowrap'>
									{user.username}
								</p>
							</div>
						</div>
						<div className='col-span-1 text-center relative flex justify-center'>
							{isEditing && username !== user.username ? (
								<div className='relative'>
									<button
										id={`role-button-${user._id}`}
										onClick={() => handleRoleDropdownToggle(user._id)}
										className='flex items-center text-violet-3 justify-center gap-2 text-base capitalize bg-transparent border-none cursor-pointer'
									>
										<span>
											{user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้'}
										</span>
										<Image
											src='/assets/dropdown.svg'
											alt='dropdown'
											width={12}
											height={12}
											style={{ width: 'auto', height: 'auto' }}
										/>
									</button>

									{openDropdownId === user._id && (
										<div
											className='role-dropdown fixed w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[120px]'
											style={{
												top: `${
													document
														.getElementById(`role-button-${user._id}`)
														?.getBoundingClientRect().bottom ?? 0 + 8
												}px`,
												left: `${
													(document
														.getElementById(`role-button-${user._id}`)
														?.getBoundingClientRect().left || 0) +
													(document
														.getElementById(`role-button-${user._id}`)
														?.getBoundingClientRect().width || 0) /
														2 -
													96
												}px`,
											}}
										>
											<button
												onClick={() => handleRoleChangeClick(user, 'admin')}
												className='w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors first:rounded-t-lg'
											>
												ผู้ดูแลระบบ
											</button>
											<button
												onClick={() =>
													handleRoleChangeClick(user, 'maintainer')
												}
												className='w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors last:rounded-b-lg'
											>
												ผู้ใช้
											</button>
										</div>
									)}
								</div>
							) : (
								<span className='text-black text-base capitalize'>
									{user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้'}
								</span>
							)}
						</div>
						<div className='absolute left-2/3 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-px h-3/4 bg-softblack'></div>
						{isEditing && username !== user.username && (
							<button
								className='absolute right-3 top-1/2 transform -translate-x-1/2 -translate-y-1/2'
								onClick={() => handleDeleteClick(user)}
							>
								<Image
									src='/assets/delete.svg'
									alt='delete'
									height={10}
									width={10}
									style={{ height: 'auto', width: 'auto' }}
									className=''
								/>
							</button>
						)}
					</div>
				))}
			</div>

			{/* Delete Confirmation Modal */}
			<Modal isOpen={isDeleteModalOpen} onClose={handleDeleteCancel} size='sm'>
				<div className='text-center py-4'>
					<p className='text-black font-semibold text-lg mb-6'>
						ยืนยันการลบผู้ใช้ &ldquo;{userToDelete?.username}&rdquo;?
					</p>
					<div className='flex gap-4 justify-evenly'>
						<button
							onClick={handleDeleteCancel}
							className='px-6 py-2 bg-red w-[25%] text-white rounded-lg hover:bg-gray-50 transition-colors'
						>
							ยกเลิก
						</button>
						<button
							onClick={handleDeleteConfirm}
							disabled={isDeleting}
							className={`px-6 py-2 w-[25%] text-white rounded-lg transition-colors ${
								isDeleting
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-green hover:bg-green-600'
							}`}
						>
							{isDeleting ? 'กำลังลบ...' : 'ยืนยัน'}
						</button>
					</div>
				</div>
			</Modal>

			{/* Delete Success Modal */}
			<Modal isOpen={isSuccessModalOpen} onClose={handleSuccessModalClose} size='sm'>
				<div className='text-center py-4'>
					<p className='text-black font-semibold text-lg mb-6'>ลบผู้ใช้สำเร็จ</p>
					<button
						onClick={handleSuccessModalClose}
						className='px-6 py-2 bg-violet-3 text-white rounded-lg hover:bg-violet-4 transition-colors'
					>
						ยืนยัน
					</button>
				</div>
			</Modal>

			{/* Role Change Confirmation Modal */}
			<Modal isOpen={isRoleConfirmModalOpen} onClose={handleRoleChangeCancel} size='sm'>
				<div className='text-center py-4'>
					<p className='text-black font-semibold text-lg mb-6'>
						ยืนยันการเปลี่ยนสิทธิ์ผู้ใช้ &ldquo;{roleChangeData?.user.username}&rdquo;
						เป็น {roleChangeData?.newRole === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้'}?
					</p>
					<div className='flex gap-4 justify-evenly'>
						<button
							onClick={handleRoleChangeCancel}
							className='px-6 py-2 bg-red w-[25%] text-white rounded-lg hover:bg-gray-50 transition-colors'
						>
							ยกเลิก
						</button>
						<button
							onClick={handleRoleChangeConfirm}
							disabled={isUpdatingRole}
							className={`px-6 py-2 w-[25%] text-white rounded-lg transition-colors ${
								isUpdatingRole
									? 'bg-gray-400 cursor-not-allowed'
									: 'bg-green hover:bg-green-600'
							}`}
						>
							{isUpdatingRole ? 'กำลังเปลี่ยน...' : 'ยืนยัน'}
						</button>
					</div>
				</div>
			</Modal>

			{/* Role Change Success Modal */}
			<Modal isOpen={isRoleSuccessModalOpen} onClose={handleRoleSuccessModalClose} size='sm'>
				<div className='text-center py-4'>
					<p className='text-black font-semibold text-lg mb-6'>
						เปลี่ยนสิทธิ์ผู้ใช้สำเร็จ
					</p>
					<button
						onClick={handleRoleSuccessModalClose}
						className='px-6 py-2 bg-violet-3 text-white rounded-lg hover:bg-violet-4 transition-colors'
					>
						ยืนยัน
					</button>
				</div>
			</Modal>
		</>
	);
};

export { UserList };
