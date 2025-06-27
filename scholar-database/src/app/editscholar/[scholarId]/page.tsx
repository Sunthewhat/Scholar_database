'use client';
import { AuthWrapper } from '@/components/authWrapper';
import { HomeLayout } from '@/components/layouts/homeLayout';
import { Axios } from '@/util/axios';
import { ScholarResponse } from '@/types/response';
import { FC, useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface FormData {
	scholarshipName: string;
	description: string;
}

interface FormErrors {
	scholarshipName?: string;
	description?: string;
}

const EditScholarPage: FC = () => {
	const router = useRouter();
	const params = useParams();
	const scholarId = params.scholarId as string;

	const [formData, setFormData] = useState<FormData>({
		scholarshipName: '',
		description: '',
	});
	const [errors, setErrors] = useState<FormErrors>({});
	const [isLoading, setIsLoading] = useState(false);
	const [isDataLoading, setIsDataLoading] = useState(true);

	useEffect(() => {
		const fetchScholarData = async () => {
			try {
				setIsDataLoading(true);
				const response = await Axios.get<ScholarResponse.getById>(`/scholar/${scholarId}`);

				if (response.status === 200 && response.data.success) {
					const scholar = response.data.data;
					setFormData({
						scholarshipName: scholar.name,
						description: scholar.description,
					});
				} else {
					console.error('API Error:', response.data.msg);
					router.push('/');
				}
			} catch (error: any) {
				console.error('Fetch error:', error);
				router.push('/');
			} finally {
				setIsDataLoading(false);
			}
		};

		if (scholarId) {
			fetchScholarData();
		}
	}, [scholarId, router]);

	const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		if (errors[name as keyof FormErrors]) {
			setErrors((prev) => ({
				...prev,
				[name]: undefined,
			}));
		}
	};

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const newErrors: FormErrors = {};
		if (!formData.scholarshipName.trim()) {
			newErrors.scholarshipName = 'กรุณากรอกชื่อทุนการศึกษา';
		}
		if (!formData.description.trim()) {
			newErrors.description = 'กรุณากรอกรายละเอียด';
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		setIsLoading(true);
		try {
			const response = await Axios.put<ScholarResponse.update>(`/scholar/${scholarId}`, {
				name: formData.scholarshipName,
				description: formData.description,
			});

			if (response.status === 200 && response.data.success) {
				router.push('/');
			} else {
				console.error('API Error:', response.data.msg);
			}
		} catch (error: any) {
			console.error('Update error:', error);
			const errorMessage =
				error.response?.data?.msg || 'เกิดข้อผิดพลาดในการอัปเดตทุนการศึกษา';
		} finally {
			setIsLoading(false);
		}
	};

	const handleCancel = () => {
		router.push('/');
	};

	if (isDataLoading) {
		return (
			<AuthWrapper>
				<HomeLayout>
					<div className='w-3/4 h-full flex flex-col mx-auto pt-16 mt-20'>
						<div className='text-center'>
							<div className='text-lg'>กำลังโหลดข้อมูล...</div>
						</div>
					</div>
				</HomeLayout>
			</AuthWrapper>
		);
	}

	if (false) { // Temporarily disabled
		return (
			<AuthWrapper>
				<HomeLayout>
					<div className='w-3/4 h-full flex flex-col mx-auto pt-16 mt-20'>
						<div className='text-center'>
							<div className='text-lg text-red-500'>ไม่พบข้อมูลทุนการศึกษา</div>
						</div>
					</div>
				</HomeLayout>
			</AuthWrapper>
		);
	}

	return (
		<AuthWrapper>
			<HomeLayout>
				<div className='w-3/4 h-full flex flex-col mx-auto pt-16 mt-20'>
					<h1 className='text-2xl font-semibold text-center mb-8'>แก้ไขทุนการศึกษา</h1>
					<form onSubmit={onSubmit} className=''>
						<div className='flex flex-col w-full mt-0'>
							<label className='font-semibold'>ชื่อทุนการศึกษา</label>
							<div className='relative'>
								<input
									name='scholarshipName'
									className={`w-full h-10 rounded-xl mt-2 px-4 ${
										errors.scholarshipName ? 'border-2 border-red-500' : ''
									}`}
									value={formData.scholarshipName}
									onChange={onChange}
								/>
							</div>
							<div className='h-5 mt-1'>
								{errors.scholarshipName && (
									<span className='text-red text-sm'>
										{errors.scholarshipName}
									</span>
								)}
							</div>
						</div>
						<div className='flex flex-col w-full mt-0'>
							<label className='font-semibold'>รายละเอียด</label>
							<div className='relative'>
								<textarea
									name='description'
									className={`w-full h-40 rounded-xl mt-2 px-4 py-2 ${
										errors.description ? 'border-2 border-red-500' : ''
									}`}
									value={formData.description}
									onChange={onChange}
								/>
							</div>
							<div className='h-5 mt-1'>
								{errors.description && (
									<span className='text-red text-sm'>{errors.description}</span>
								)}
							</div>
						</div>
						<div className='w-full flex justify-between'>
							<button
								type='button'
								onClick={handleCancel}
								className='px-6 py-2 rounded-xl bg-red text-white mt-4'
							>
								ยกเลิก
							</button>
							<button
								type='submit'
								disabled={isLoading}
								className={`bg-green text-white px-6 py-2 rounded-xl mt-4 ${
									isLoading ? 'opacity-50 cursor-not-allowed' : ''
								}`}
							>
								{isLoading ? 'กำลังอัปเดต...' : 'ยืนยัน'}
							</button>
						</div>
					</form>
				</div>
			</HomeLayout>
		</AuthWrapper>
	);
};

export default EditScholarPage;
