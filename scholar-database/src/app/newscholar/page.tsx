'use client';
import { AuthWrapper } from '@/components/authWrapper';
import { HomeLayout } from '@/components/layouts/homeLayout';
import { Modal } from '@/components/modal';
import { Axios } from '@/util/axios';
import { ScholarResponse } from '@/types/response';
import { FC, useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

interface FormData {
	scholarshipName: string;
	description: string;
}

interface FormErrors {
	scholarshipName?: string;
	description?: string;
}

const NewScholarPage: FC = () => {
	const router = useRouter();
	const [formData, setFormData] = useState<FormData>({
		scholarshipName: '',
		description: '',
	});
	const [errors, setErrors] = useState<FormErrors>({});
	const [isLoading, setIsLoading] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const [scholarId, setScholarId] = useState('');

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
			// First, create the scholar
			const response = await Axios.post<ScholarResponse.create>('/scholar', {
				name: formData.scholarshipName,
				description: formData.description,
			});

			if (response.status === 200 && response.data.success) {
				const newScholarId = response.data.data._id;
				
				// Create default "Personal Information" section with required name and surname fields
				const defaultPersonalInfoSection = {
					scholar_id: newScholarId,
					field_name: 'personal_information',
					field_label: 'ข้อมูลส่วนตัว',
					field_description: 'กรุณากรอกข้อมูลส่วนตัวของท่าน',
					order: 0,
					questions: [
						{
							question_id: 'name',
							question_type: 'short_answer',
							question_label: 'ชื่อ',
							required: true,
							order: 0,
							placeholder: 'กรอกชื่อของท่าน',
							allow_other: false
						},
						{
							question_id: 'surname',
							question_type: 'short_answer', 
							question_label: 'นามสกุล',
							required: true,
							order: 1,
							placeholder: 'กรอกนามสกุลของท่าน',
							allow_other: false
						}
					]
				};

				// Create the default section
				const sectionResponse = await Axios.post('/scholar-field', defaultPersonalInfoSection);
				
				if (sectionResponse.status === 200 && sectionResponse.data.success) {
					setScholarId(newScholarId);
					setShowModal(true);
				} else {
					console.error('Failed to create default section:', sectionResponse.data.msg);
					// Still show success modal as scholar was created
					setScholarId(newScholarId);
					setShowModal(true);
				}
			} else {
				console.error('API Error:', response.data.msg);
				// You might want to show an error message to the user here
			}
		} catch (error: any) {
			console.error('Submission error:', error);
			const errorMessage = error.response?.data?.msg || 'เกิดข้อผิดพลาดในการสร้างทุนการศึกษา';
			// You might want to show an error message to the user here
		} finally {
			setIsLoading(false);
		}
	};

	const handleModalYes = () => {
		router.push(`/form/create/${scholarId}`);
	};

	const handleModalNo = () => {
		router.push('/');
	};

	return (
		<AuthWrapper>
			<HomeLayout>
				<div className='w-3/4 h-full flex flex-col mx-auto pt-16 mt-20'>
					<h1 className='text-2xl font-semibold text-center mb-8'>
						สร้างทุนการศึกษาใหม่
					</h1>
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
						<div className='w-full flex justify-end'>
							<button
								type='submit'
								disabled={isLoading}
								className={`bg-violet-3 text-white px-6 py-2 rounded-xl mt-4 hover:bg-blue-600 ${
									isLoading ? 'opacity-50 cursor-not-allowed' : ''
								}`}
							>
								{isLoading ? 'กำลังสร้าง...' : 'สร้าง'}
							</button>
						</div>
					</form>
				</div>
				<Modal isOpen={showModal} onClose={() => setShowModal(false)}>
					<div className='text-center'>
						<h2 className='text-xl font-semibold mb-4'>สร้างทุนการศึกษาสำเร็จ!</h2>
						<p className='text-gray-600 mb-6'>
							คุณต้องการสร้างฟอร์มสำหรับทุนการศึกษานี้หรือไม่?
						</p>
						<div className='flex gap-4 justify-center'>
							<button
								onClick={handleModalNo}
								className='px-6 py-2 rounded-xl w-[30%] border border-gray-300 text-gray-700 hover:bg-gray-50'
							>
								ไม่
							</button>
							<button
								onClick={handleModalYes}
								className='px-6 py-2 rounded-xl w-[30%] bg-violet-3 text-white hover:bg-blue-600'
							>
								ใช่
							</button>
						</div>
					</div>
				</Modal>
			</HomeLayout>
		</AuthWrapper>
	);
};

export default NewScholarPage;
