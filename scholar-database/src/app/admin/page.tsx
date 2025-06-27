'use client';
import { AuthWrapper } from '@/components/authWrapper';
import Image from 'next/image';
import { HomeLayout } from '@/components/layouts/homeLayout';
import { UserList } from '@/components/admin/userList';
import { UserType } from '@/types/user';
import { Axios } from '@/util/axios';
import { FC, useState } from 'react';
import { useRouter } from 'next/navigation';

const AdminPage: FC = () => {
	const navigator = useRouter();
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const handleCancelEditing = () => {
		setIsEditing(false);
	};

	const handleSuccessEditing = () => {
		setIsEditing(false);
	};

	const handleAddNewUser = () => {
		navigator.push('/newuser');
	};

	const handleDeleteUser = async (id: string): Promise<boolean> => {
		try {
			const response = await Axios.delete(`/auth/users/${id}`);

			if (response.status === 200 && response.data.success) {
				return true;
			} else {
				console.error('Failed to delete user:', response.data.msg);
				return false;
			}
		} catch (error) {
			console.error('Error deleting user:', error);
			return false;
		}
	};

	const handleUpdateUserRole = async (id: string, newRole: UserType.role): Promise<boolean> => {
		try {
			const response = await Axios.patch(`/auth/users/${id}/role`, {
				role: newRole,
			});

			if (response.status === 200 && response.data.success) {
				return true;
			} else {
				console.error('Failed to update user role:', response.data.msg);
				return false;
			}
		} catch (error) {
			console.error('Error updating user role:', error);
			return false;
		}
	};
	return (
		<AuthWrapper requiredRole='admin'>
			<HomeLayout>
				<div className='relative flex flex-col mt-24 w-[90%] mx-auto h-full pt-10'>
					<h1 className='text-2xl font-semibold text-center'>จัดการบัญชีผู้ใช้</h1>
					<div className='w-full flex justify-end gap-6'>
						{!isEditing && (
							<button
								className='bg-violet-3 flex gap-2 w-36 justify-center items-center text-white px-5 py-1 rounded-xl'
								onClick={() => setIsEditing(true)}
							>
								<Image
									src='/assets/edit.svg'
									alt='add'
									width={10}
									height={10}
									className=''
									style={{
										width: 'auto',
										height: 'auto',
										filter: 'brightness(0) saturate(100%) invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
									}}
								/>
								<p className='text-center mt-1'>แก้ไขผู้ใช้</p>
							</button>
						)}
						{!isEditing && (
							<button
								className='bg-violet-3 flex w-36 justify-center gap-2 items-center text-white px-5 py-1 rounded-xl'
								onClick={handleAddNewUser}
							>
								<Image
									src='/assets/add.svg'
									alt='add'
									width={10}
									height={10}
									className=''
									style={{ width: 'auto', height: 'auto' }}
								/>
								<p className='text-center mt-1'>เพิ่มผู้ใช้</p>
							</button>
						)}
						{isEditing && (
							<button
								className='bg-green flex w-36 justify-center gap-2 items-center text-white px-5 py-1 rounded-xl'
								onClick={handleSuccessEditing}
							>
								<p className='text-center mt-1'>ยืนยัน</p>
							</button>
						)}
						{isEditing && (
							<button
								className='bg-red flex gap-2 w-36 justify-center items-center text-white px-5 py-1 rounded-xl'
								onClick={handleCancelEditing}
							>
								<p className='text-center mt-1'>ยกเลิก</p>
							</button>
						)}
					</div>
					<div className='flex flex-col max-h-[70dvh] overflow-scroll w-full mt-8'>
						<div className='w-full bg-violet-2 h-16 min-h-16 grid grid-cols-3 rounded-2xl text-white text-xl text-center items-center relative'>
							<h1 className='col-span-2'>ชื่อผู้ใช้</h1>
							<h1 className='col-span-1'>สิทธิ์</h1>
							<div className='absolute left-2/3 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-px h-3/4 bg-violet-3'></div>
						</div>
						<UserList
							isEditing={isEditing}
							handleDeleteUser={handleDeleteUser}
							handleUpdateUserRole={handleUpdateUserRole}
						/>
					</div>
				</div>
			</HomeLayout>
		</AuthWrapper>
	);
};

export default AdminPage;
