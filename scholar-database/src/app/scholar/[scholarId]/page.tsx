'use client';
import { AuthWrapper } from '@/components/authWrapper';
import { HomeLayout } from '@/components/layouts/homeLayout';
import { Modal } from '@/components/modal';
import { Student } from '@/types/student';
import { Scholar } from '@/types/scholar';
import { StudentResponse } from '@/types/response';
import { useApiData } from '@/utils/api';
import { Axios } from '@/util/axios';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FC, useState, useEffect } from 'react';

const ScholarDetailPage: FC = () => {
	const router = useRouter();
	const params = useParams();
	const scholarId = params.scholarId as string;

	// Fetch scholar data using the same pattern as other components
	const {
		data: scholar,
		isLoading: isScholarLoading,
		isError: isScholarError,
	} = useApiData<Scholar>(`/scholar/${scholarId}`);

	const [students, setStudents] = useState<Student[]>([]);
	const [isStudentsLoading, setIsStudentsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
	const [generatedLink, setGeneratedLink] = useState<string>('');
	const [isGeneratingLink, setIsGeneratingLink] = useState(false);
	const [linkExpiration, setLinkExpiration] = useState<string>('');

	// Fetch students for this scholar
	useEffect(() => {
		const fetchStudents = async () => {
			try {
				setIsStudentsLoading(true);
				const response = await Axios.get<StudentResponse.getByScholar>(
					`/student/scholar/${scholarId}`
				);

				if (response.status === 200 && response.data.success) {
					setStudents(response.data.data);
				} else {
					setError(response.data.msg || 'เกิดข้อผิดพลาดในการดึงข้อมูลนักเรียน');
				}
			} catch (err: any) {
				console.error('Error fetching students:', err);
				setError(err.response?.data?.msg || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
			} finally {
				setIsStudentsLoading(false);
			}
		};

		fetchStudents();
	}, [scholarId]);

	// Create new student
	const handleCreateStudent = async () => {
		try {
			setIsCreating(true);
			const response = await Axios.post<StudentResponse.create>('/student', {
				scholar_id: scholarId,
				form_data: {},
			});

			if (response.status === 200 && response.data.success) {
				// Navigate to the form page for the new student
				router.push(`/student/${response.data.data._id}/form?create=true`);
			} else {
				setError(response.data.msg || 'เกิดข้อผิดพลาดในการสร้างนักเรียน');
			}
		} catch (err: any) {
			console.error('Error creating student:', err);
			setError(err.response?.data?.msg || 'เกิดข้อผิดพลาดในการสร้างนักเรียน');
		} finally {
			setIsCreating(false);
		}
	};

	const handleDeleteStudentClick = (student: Student) => {
		setStudentToDelete(student);
		setIsDeleteModalOpen(true);
	};

	const handleDeleteStudent = async () => {
		if (!studentToDelete) return;

		try {
			setIsDeleting(true);
			const response = await Axios.delete(`/student/${studentToDelete._id}`);

			if (response.status === 200 && response.data.success) {
				// Remove from local state
				setStudents(students.filter((s) => s._id !== studentToDelete._id));

				// Close modal
				setIsDeleteModalOpen(false);
				setStudentToDelete(null);
			} else {
				setError(response.data.msg || 'เกิดข้อผิดพลาดในการลบนักเรียน');
			}
		} catch (err: any) {
			console.error('Error deleting student:', err);
			setError(err.response?.data?.msg || 'เกิดข้อผิดพลาดในการลบนักเรียน');
		} finally {
			setIsDeleting(false);
		}
	};

	const handleDeleteCancel = () => {
		setIsDeleteModalOpen(false);
		setStudentToDelete(null);
	};

	const handleGetStudentLink = async (student: Student) => {
		try {
			setIsGeneratingLink(true);
			const response = await Axios.post('/student/temp-permission/generate', {
				student_id: student._id,
				expires_in: 3600 * 24 * 7, // 24 hours
			});

			if (response.status === 200 && response.data.success) {
				const { token, expires_at } = response.data.data;

				// Create the complete link with token
				const baseUrl = window.location.origin;
				const fullLink = `${baseUrl}/temp/student/${student._id}/form?token=${token}`;

				setGeneratedLink(fullLink);
				setLinkExpiration(new Date(expires_at).toLocaleString('th-TH'));
				setIsLinkModalOpen(true);
			} else {
				setError(response.data.msg || 'เกิดข้อผิดพลาดในการสร้างลิ้งค์');
			}
		} catch (err: any) {
			console.error('Error generating student link:', err);
			setError(err.response?.data?.msg || 'เกิดข้อผิดพลาดในการสร้างลิ้งค์');
		} finally {
			setIsGeneratingLink(false);
		}
	};

	const handleStudentCardClick = (studentId: string) => {
		router.push(`/student/${studentId}/form`);
	};

	const handleCloseLinkModal = () => {
		setIsLinkModalOpen(false);
		setGeneratedLink('');
		setLinkExpiration('');
	};

	const handleCopyLink = async () => {
		try {
			await navigator.clipboard.writeText(generatedLink);
			// You could add a toast notification here if needed
		} catch (err) {
			console.error('Failed to copy link:', err);
		}
	};

	const getStatusDisplay = (status: string) => {
		switch (status) {
			case 'completed':
				return { text: 'สมบูรณ์', color: 'bg-green' };
			case 'incomplete':
				return { text: 'ไม่สมบูรณ์', color: 'bg-red' };
			default:
				return { text: status, color: '' };
		}
	};

	if (isScholarLoading || isStudentsLoading) {
		return (
			<AuthWrapper>
				<HomeLayout>
					<div className='flex items-center justify-center h-full'>
						<p>กำลังโหลด...</p>
					</div>
				</HomeLayout>
			</AuthWrapper>
		);
	}

	if (isScholarError || !scholar) {
		return (
			<AuthWrapper>
				<HomeLayout>
					<div className='flex items-center justify-center h-full'>
						<p>ไม่พบข้อมูลทุนการศึกษา</p>
					</div>
				</HomeLayout>
			</AuthWrapper>
		);
	}

	return (
		<AuthWrapper>
			<HomeLayout>
				<div className='w-3/4 h-full flex flex-col mx-auto mt-20 overflow-scroll'>
					{/* Scholar Information Section */}
					<div className='w-3/4 mb-10'>
						<h1 className='text-3xl font-bold text-black mb-2'>{scholar.name}</h1>
						<div className='border-b-4 border-violet-3'></div>
						{scholar.description && (
							<p
								className='text-black mt-4 text-base w-full break-words whitespace-pre-wrap overflow-hidden'
								style={{
									display: '-webkit-box',
									WebkitLineClamp: 4,
									WebkitBoxOrient: 'vertical',
								}}
							>
								{scholar.description}
							</p>
						)}
						<div className='flex items-center gap-2 mt-2'></div>
					</div>

					<div className='flex items-center justify-end gap-5 mb-8'>
						<Link href={`/form/edit/${scholarId}`}>
							<button className='flex gap-2 items-center bg-violet-3 text-white px-4 py-2 rounded-xl hover:bg-blue-600'>
								<Image
									src='/assets/edit.svg'
									alt='edit'
									height={14}
									width={14}
									style={{
										width: 'auto',
										height: 'auto',
										filter: 'brightness(0) saturate(100%) invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)',
									}}
								/>
								<h1 className='text-base font-semibold ml-2'>
									สร้าง/แก้ไข ฟอร์มกรอกข้อมูล
								</h1>
							</button>
						</Link>
						<button
							className='flex gap-2 items-center bg-violet-3 text-white px-4 py-2 rounded-xl hover:bg-blue-600'
							onClick={handleCreateStudent}
						>
							<Image
								src='/assets/add.svg'
								alt='edit'
								height={16}
								width={16}
								style={{ width: 'auto', height: 'auto' }}
							/>
							<h1 className='text-base font-semibold'>เพิ่มนักเรียน</h1>
						</button>
					</div>

					{error && (
						<div className='w-full mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md'>
							{error}
						</div>
					)}

					<div className='flex flex-col max-h-[70dvh] overflow-y-auto w-full'>
						{students.length === 0 ? (
							<div className='flex items-center justify-center h-40 text-gray-500'>
								<p>
									ยังไม่มีนักเรียน กดปุ่ม &quot;เพิ่มนักเรียน&quot; เพื่อเริ่มต้น
								</p>
							</div>
						) : (
							<div className=''>
								<div className='w-full bg-violet-2 h-16 min-h-16 grid grid-cols-3 rounded-2xl text-white text-xl text-center items-center relative'>
									<h1 className='col-span-2'>รายชื่อนักเรียน</h1>
									<h1 className='col-span-1'>สถานะ</h1>
									<div className='absolute left-2/3 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-px h-3/4 bg-violet-3'></div>
								</div>
								{students.map((student, index) => {
									const statusInfo = getStatusDisplay(student.status);
									return (
										<div
											key={student._id}
											onClick={(e) => {
												// Allow clicks on the card but prevent clicks on buttons
												const target = e.target as HTMLElement;
												const isButton =
													target.tagName === 'BUTTON' ||
													target.closest('button');

												if (!isButton) {
													handleStudentCardClick(student._id!);
												}
											}}
											className='w-full mt-4 bg-white h-16 grid grid-cols-3 rounded-2xl text-black text-xl text-center items-center relative cursor-pointer hover:bg-gray-50 transition-colors'
										>
											<div className='col-span-2 text-left ml-8 flex justify-between items-center'>
												<p className='text-black text-base text-ellipsis overflow-hidden whitespace-nowrap flex-1 min-w-0 pr-4'>
													{student.fullname}
												</p>
												<div className='flex gap-4 mr-8 flex-shrink-0'>
													<button
														onClick={(e) => {
															e.stopPropagation();
															handleDeleteStudentClick(student);
														}}
														title='ลบนักเรียน'
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
											<div className='col-span-1 flex justify-center'>
												<div
													className={
														statusInfo.color +
														' rounded-full w-32 px-4 text-base py-2 text-white'
													}
												>
													{statusInfo.text}
												</div>
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleGetStudentLink(student);
													}}
													title='สร้างลิ้งค์สำหรับส่งให้นักเรียน'
													className='absolute right-4 top-1/2 transform -translate-y-1/2'
													disabled={isGeneratingLink}
												>
													{isGeneratingLink ? (
														<div className='w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600'></div>
													) : (
														<Image
															src='/assets/link.svg'
															alt='link'
															height={1}
															width={1}
															className='w-5'
														/>
													)}
												</button>
											</div>
											<div className='absolute left-2/3 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-px h-3/4 bg-softblack'></div>
										</div>
									);
								})}
							</div>
						)}
					</div>
					<div className='w-full flex justify-end items-center mt-6'>
						<p className='text-gray-600'>
							จำนวนนักเรียนที่มีสถานะสมบูรณ์{' '}
							{students.filter((s) => s.status === 'completed').length} /{' '}
							{students.length} คน
						</p>
					</div>
				</div>
			</HomeLayout>

			{/* Delete Confirmation Modal */}
			<Modal isOpen={isDeleteModalOpen} onClose={handleDeleteCancel} size='sm'>
				<div className='text-center py-4'>
					<p className='text-black font-semibold text-lg mb-6'>ยืนยันการลบนักเรียน?</p>
					<div className='flex gap-4 justify-evenly'>
						<button
							onClick={handleDeleteCancel}
							className='px-6 py-2 bg-red w-[25%] text-white rounded-lg hover:bg-gray-50 transition-colors'
						>
							ยกเลิก
						</button>
						<button
							onClick={handleDeleteStudent}
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

			{/* Student Link Modal */}
			<Modal isOpen={isLinkModalOpen} onClose={handleCloseLinkModal} size='md'>
				<div className='text-center py-4'>
					<p className='text-black font-semibold text-lg mb-6'>ลิ้งค์สำหรับนักเรียน</p>
					<div className='bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4'>
						<p className='text-sm text-gray-600 mb-2'>
							ลิ้งค์นี้จะหมดอายุเมื่อ: {linkExpiration}
						</p>
						<div className='flex items-center gap-2'>
							<input
								type='text'
								value={generatedLink}
								readOnly
								className='flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm'
							/>
							<button
								onClick={handleCopyLink}
								className='px-4 py-2 bg-violet-1 text-white rounded-md hover:bg-blue-600 transition-colors text-sm'
							>
								คัดลอก
							</button>
						</div>
					</div>
					<p className='text-sm text-gray-500 mb-6'>
						ส่งลิ้งค์นี้ให้นักเรียนเพื่อให้สามารถกรอกข้อมูลในฟอร์มได้
					</p>
					<button
						onClick={handleCloseLinkModal}
						className='px-6 py-2 bg-red w-32 font-semibold text-white rounded-lg hover:bg-gray-600 transition-colors'
					>
						ปิด
					</button>
				</div>
			</Modal>
		</AuthWrapper>
	);
};

export default ScholarDetailPage;
