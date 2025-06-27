/* eslint-disable react-hooks/exhaustive-deps */
import { ScholarResponse, StudentResponse } from '@/types/response';
import { Scholar } from '@/types/scholar';
import { Axios } from '@/util/axios';
import { Modal } from '@/components/modal';
import Image from 'next/image';
import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react';
import { useApiData } from '@/utils/api';
import { useRouter } from 'next/navigation';

type ScholarListType = {
	setCount: Dispatch<SetStateAction<number>>;
};

const ScholarList: FC<ScholarListType> = ({ setCount }) => {
	const {
		data: scholars,
		isLoading,
		isError,
		refetch: fetchScholars,
		setData: setScholars,
	} = useApiData<Scholar[]>('/scholar');

	const router = useRouter();

	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [scholarToDelete, setScholarToDelete] = useState<Scholar | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});

	const handleDeleteClick = (scholar: Scholar) => {
		setScholarToDelete(scholar);
		setIsDeleteModalOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!scholarToDelete || !scholars) return;

		try {
			setIsDeleting(true);
			// Real delete API call
			const response = await Axios.delete<ScholarResponse.deleteScholar>(
				`/scholar/${scholarToDelete._id}`
			);

			if (response.status === 200 && response.data.success) {
				// Remove from local state
				const updatedScholars = scholars.filter((s) => s._id !== scholarToDelete._id);
				setScholars(updatedScholars);
				setCount(updatedScholars.length);

				// Close modal
				setIsDeleteModalOpen(false);
				setScholarToDelete(null);
			} else {
				console.error('Failed to delete scholar:', response.data.msg);
			}
		} catch (error) {
			console.error('Error deleting scholar:', error);
		} finally {
			setIsDeleting(false);
		}
	};

	const handleDeleteCancel = () => {
		setIsDeleteModalOpen(false);
		setScholarToDelete(null);
	};

	const handleEditScholar = (id: string) => {
		router.push(`/editscholar/${id}`);
	};

	const handleScholarCardClick = (scholarId: string) => {
		router.push(`/scholar/${scholarId}`);
	};

	// Fetch student counts for all scholars
	const fetchStudentCounts = async () => {
		if (!scholars) return;

		try {
			const countPromises = scholars.map(async (scholar) => {
				try {
					const response = await Axios.get<StudentResponse.getCount>(
						`/student/scholar/${scholar._id}/count`
					);
					if (response.status === 200 && response.data.success) {
						return { scholarId: scholar._id, count: response.data.data.count };
					}
					return { scholarId: scholar._id, count: 0 };
				} catch (error) {
					console.error(`Error fetching count for scholar ${scholar._id}:`, error);
					return { scholarId: scholar._id, count: 0 };
				}
			});

			const results = await Promise.all(countPromises);
			const countsMap = results.reduce((acc, { scholarId, count }) => {
				acc[scholarId] = count;
				return acc;
			}, {} as Record<string, number>);

			setStudentCounts(countsMap);
		} catch (error) {
			console.error('Error fetching student counts:', error);
		}
	};

	useEffect(() => {
		if (scholars) {
			setCount(scholars.length);
			fetchStudentCounts();
		}
	}, [scholars, setCount]);

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
					onClick={fetchScholars}
					className='px-4 py-2 bg-violet-3 text-white rounded-lg hover:bg-violet-4 transition-colors'
				>
					ลองใหม่
				</button>
			</div>
		);
	}

	if (!scholars || scholars.length === 0) {
		return (
			<div className='flex justify-center items-center h-40'>
				<div className='text-lg text-gray-600'>ไม่มีข้อมูลทุนการศึกษา</div>
			</div>
		);
	}

	return (
		<>
			<div className='w-full flex flex-col'>
				{scholars.map((scholar) => (
					<div
						key={scholar._id}
						onClick={(e) => {
							// Allow clicks on the card, scholar name, student count, and empty areas
							// but prevent clicks on buttons
							const target = e.target as HTMLElement;
							const isButton =
								target.tagName === 'BUTTON' || target.closest('button');

							if (!isButton) {
								handleScholarCardClick(scholar._id);
							}
						}}
						className='w-full mt-4 bg-white h-16 grid grid-cols-3 rounded-2xl text-black text-xl text-center items-center relative cursor-pointer hover:bg-gray-50 transition-colors'
					>
						<div className='col-span-2 text-left ml-8 flex justify-between items-center'>
							<h3 className='text-black text-base text-ellipsis overflow-hidden whitespace-nowrap flex-1 min-w-0 pr-4'>
								{scholar.name}
							</h3>
							<div className='flex gap-4 mr-8 flex-shrink-0'>
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleEditScholar(scholar._id);
									}}
									title='แก้ไขทุน'
								>
									<Image
										src='/assets/edit.svg'
										alt='edit'
										height={1}
										width={1}
										className='w-5'
									/>
								</button>
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleDeleteClick(scholar);
									}}
									title='ลบทุน'
								>
									<Image
										src='/assets/delete.svg'
										alt='delete'
										height={1}
										width={1}
										className='w-5'
									/>
								</button>
							</div>
						</div>
						<div className='col-span-1 text-center'>
							<span className='text-black text-base'>
								{studentCounts[scholar._id] || 0}
							</span>
						</div>
						<div className='absolute left-2/3 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-px h-3/4 bg-softblack'></div>
					</div>
				))}
			</div>

			{/* Delete Confirmation Modal */}
			<Modal isOpen={isDeleteModalOpen} onClose={handleDeleteCancel} size='sm'>
				<div className='text-center py-4'>
					<p className='text-black font-semibold text-lg mb-6'>{`ยืนยันการลบทุนการศึกษา?`}</p>
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
		</>
	);
};

export { ScholarList };
