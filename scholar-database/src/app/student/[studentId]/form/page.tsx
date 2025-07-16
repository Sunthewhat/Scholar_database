/* eslint-disable @next/next/no-img-element */
'use client';
import { AuthWrapper } from '@/components/authWrapper';
import { HomeLayout } from '@/components/layouts/homeLayout';
import { Modal } from '@/components/modal';
import { Student } from '@/types/student';
import { ScholarField, Question } from '@/types/scholarField';
import { ScholarFieldResponse } from '@/types/response';
import { Axios } from '@/util/axios';
import { useApiData } from '@/utils/api';
import { submitFormWithFiles, extractFilesFromFormData } from '@/utils/formData';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FC, useState, useEffect } from 'react';

const StudentFormPage: FC = () => {
	const router = useRouter();
	const params = useParams();
	const isCreating = useSearchParams().get('create');
	const studentId = params.studentId as string;

	// Use useApiData for student data
	const {
		data: student,
		isLoading: isStudentLoading,
		isError: isStudentError,
		setData: setStudent,
	} = useApiData<Student>(`/student/${studentId}`);

	const [scholarFields, setScholarFields] = useState<ScholarField[]>([]);
	const [formData, setFormData] = useState<Record<string, any>>({});
	const [isFieldsLoading, setIsFieldsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);

	// Check is it first created student
	useEffect(() => {
		if (isCreating && isCreating === 'true') setIsEditMode(true);
	}, [isCreating]);

	// Initialize form data when student data is loaded
	useEffect(() => {
		if (student && !formData.initialized) {
			setFormData({ ...student.form_data, initialized: true });
		}
	}, [student, formData.initialized]);

	// Fetch scholar fields when student data is available
	useEffect(() => {
		const fetchScholarFields = async () => {
			if (!student) return;

			try {
				setIsFieldsLoading(true);
				// Handle populated Scholar object or string ID
				const scholarId =
					typeof student.scholar_id === 'object'
						? student.scholar_id._id
						: student.scholar_id;

				const fieldsResponse = await Axios.get<ScholarFieldResponse.getAll>(
					`/scholar-field/scholar/${scholarId}`
				);
				if (fieldsResponse.status === 200 && fieldsResponse.data.success) {
					setScholarFields(fieldsResponse.data.data);
				}
			} catch (err: any) {
				console.error('Error fetching scholar fields:', err);
				setError(err.response?.data?.msg || 'เกิดข้อผิดพลาดในการดึงข้อมูลฟิลด์');
			} finally {
				setIsFieldsLoading(false);
			}
		};

		fetchScholarFields();
	}, [student]);

	// Handle form field changes
	const handleFieldChange = (fieldId: string, questionId: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			[fieldId]: {
				...prev[fieldId],
				[questionId]: value,
			},
		}));
	};

	// Handle "Other" field changes
	const handleOtherFieldChange = (fieldId: string, questionId: string, otherValue: string) => {
		setFormData((prev) => ({
			...prev,
			[fieldId]: {
				...prev[fieldId],
				[`${questionId}_other`]: otherValue,
			},
		}));
	};

	const handleBackToScholarDetail = () => {
		if (!student) {
			router.push('/');
			return;
		}
		const scholarId =
			typeof student.scholar_id === 'object' ? student.scholar_id._id : student.scholar_id;
		router.push(`/scholar/${scholarId}`);
	};

	// Check if a file is an image
	const isImageFile = (fileName: string) => {
		const imageExtensions = [
			'.png',
			'.jpg',
			'.jpeg',
			'.gif',
			'.bmp',
			'.webp',
			'.heic',
			'.heif',
		];
		const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
		return imageExtensions.includes(extension);
	};

	// Get image URL for preview
	const getImageUrl = (fileName: string) => {
		const filename = fileName.split('/').pop() || fileName;
		return `${process.env.NEXT_PUBLIC_STORAGE_URL}/storage/file/${filename}`;
	};

	// Handle file download
	const handleFileDownload = (file: File | string, fileName?: string) => {
		if (typeof file === 'string') {
			// For existing files, construct the proper download URL
			const filename = file.split('/').pop() || file;
			const downloadUrl = `${process.env.NEXT_PUBLIC_STORAGE_URL}/storage/file/${filename}`;

			// Create a temporary link to trigger download
			const link = document.createElement('a');
			link.href = downloadUrl;
			link.download = filename;
			link.target = '_blank';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} else if (file instanceof File) {
			// For newly uploaded files, create download link
			const url = URL.createObjectURL(file);
			const link = document.createElement('a');
			link.href = url;
			link.download = fileName || file.name;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		}
	};

	const handleCancelCreation = async () => {
		if (!isCreating) {
			setIsEditMode(false);
			// Reset form data to original student data
			if (student) {
				setFormData({
					...student.form_data,
					initialized: true,
				});
			}
		} else {
			await Axios.delete(`/student/${studentId}`);
			router.back();
		}
	};

	// Clean data to remove undefined values that can't be serialized to JSON
	const cleanFormData = (data: Record<string, any>): Record<string, any> => {
		const cleaned: Record<string, any> = {};

		for (const [key, value] of Object.entries(data)) {
			if (value !== undefined) {
				if (value === null) {
					// null is valid JSON
					cleaned[key] = value;
				} else if (Array.isArray(value)) {
					// Arrays including File arrays - preserve all arrays
					cleaned[key] = value;
				} else if (value instanceof File) {
					// Preserve File objects
					cleaned[key] = value;
				} else if (typeof value === 'object') {
					// Recursively clean nested objects
					const cleanedValue = cleanFormData(value);
					if (Object.keys(cleanedValue).length > 0) {
						cleaned[key] = cleanedValue;
					}
				} else {
					// Primitive values (string, number, boolean)
					cleaned[key] = value;
				}
			}
		}

		return cleaned;
	};

	// Save as draft
	const handleSaveDraft = async () => {
		try {
			setIsSaving(true);

			// Clean form data to remove undefined values and extract files
			const cleanedFormData = cleanFormData(formData);
			const { cleanFormData: dataWithoutFiles, files } =
				extractFilesFromFormData(cleanedFormData);

			const response = await submitFormWithFiles({
				endpoint: `/student/${studentId}`,
				method: 'PUT',
				formData: dataWithoutFiles,
				files,
			});

			if (response.status === 200 && response.data.success) {
				setStudent(response.data.data);
				setError(null);
				setIsEditMode(false);
				setShowSuccessModal(true);
			} else {
				setError(response.data.msg || 'เกิดข้อผิดพลาดในการบันทึก');
			}
		} catch (err: any) {
			console.error('Error saving draft:', err);
			setError(err.response?.data?.msg || 'เกิดข้อผิดพลาดในการบันทึก');
		} finally {
			setIsSaving(false);
		}
	};

	// Render individual question
	const renderQuestion = (field: ScholarField, question: Question) => {
		const fieldData = formData[field._id!] || {};
		const questionValue = fieldData[question.question_id] || '';
		const otherValue = fieldData[`${question.question_id}_other`] || '';

		switch (question.question_type) {
			case 'short_answer':
				return (
					<input
						type='text'
						value={questionValue}
						onChange={(e) =>
							handleFieldChange(field._id!, question.question_id, e.target.value)
						}
						placeholder={question.placeholder || 'กรอกข้อความสั้น...'}
						className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
							!isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
						}`}
						disabled={!isEditMode}
						readOnly={!isEditMode}
					/>
				);

			case 'long_answer':
				return (
					<textarea
						value={questionValue}
						onChange={(e) =>
							handleFieldChange(field._id!, question.question_id, e.target.value)
						}
						placeholder={question.placeholder || 'กรอกข้อความยาว...'}
						rows={4}
						className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
							!isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
						}`}
						disabled={!isEditMode}
						readOnly={!isEditMode}
					/>
				);

			case 'radio':
				return (
					<div className='space-y-2'>
						{(question.options || []).map((option, index) => (
							<div key={index} className='flex items-center'>
								<input
									type='radio'
									name={`${field._id}_${question.question_id}`}
									value={option}
									checked={questionValue === option}
									onChange={(e) =>
										handleFieldChange(
											field._id!,
											question.question_id,
											e.target.value
										)
									}
									className={`h-4 w-4 text-blue-600 mr-3 ${
										!isEditMode ? 'cursor-not-allowed' : ''
									}`}
									disabled={!isEditMode}
								/>
								<span className='text-gray-700'>{option}</span>
							</div>
						))}
						{/* Other option - only show if allow_other is true */}
						{question.allow_other && (
							<div className='flex items-center gap-2'>
								<input
									type='radio'
									name={`${field._id}_${question.question_id}`}
									value='other'
									checked={questionValue === 'other'}
									onChange={(e) =>
										handleFieldChange(
											field._id!,
											question.question_id,
											e.target.value
										)
									}
									className={`h-4 w-4 text-blue-600 mr-3 ${
										!isEditMode ? 'cursor-not-allowed' : ''
									}`}
									disabled={!isEditMode}
								/>
								<span className='text-gray-700'>อื่นๆ:</span>
								<input
									type='text'
									value={otherValue}
									onChange={(e) =>
										handleOtherFieldChange(
											field._id!,
											question.question_id,
											e.target.value
										)
									}
									placeholder='ระบุ...'
									className={`flex-1 px-2 py-1 border border-gray-300 rounded text-sm ${
										!isEditMode || questionValue !== 'other'
											? 'bg-gray-50 cursor-not-allowed'
											: ''
									}`}
									disabled={!isEditMode || questionValue !== 'other'}
									readOnly={!isEditMode}
								/>
							</div>
						)}
					</div>
				);

			case 'checkbox':
				return (
					<div className='space-y-2'>
						{(question.options || []).map((option, index) => {
							const isChecked =
								Array.isArray(questionValue) && questionValue.includes(option);
							return (
								<div key={index} className='flex items-center'>
									<input
										type='checkbox'
										value={option}
										checked={isChecked}
										onChange={(e) => {
											const currentValues = Array.isArray(questionValue)
												? questionValue
												: [];
											const newValues = e.target.checked
												? [...currentValues, option]
												: currentValues.filter((v) => v !== option);
											handleFieldChange(
												field._id!,
												question.question_id,
												newValues
											);
										}}
										className={`h-4 w-4 text-blue-600 rounded mr-3 ${
											!isEditMode ? 'cursor-not-allowed' : ''
										}`}
										disabled={!isEditMode}
									/>
									<span className='text-gray-700'>{option}</span>
								</div>
							);
						})}
						{/* Other option - only show if allow_other is true */}
						{question.allow_other && (
							<div className='flex items-center gap-2'>
								<input
									type='checkbox'
									value='other'
									checked={
										Array.isArray(questionValue) &&
										questionValue.includes('other')
									}
									onChange={(e) => {
										const currentValues = Array.isArray(questionValue)
											? questionValue
											: [];
										const newValues = e.target.checked
											? [...currentValues, 'other']
											: currentValues.filter((v) => v !== 'other');
										handleFieldChange(
											field._id!,
											question.question_id,
											newValues
										);
									}}
									className={`h-4 w-4 text-blue-600 rounded mr-3 ${
										!isEditMode ? 'cursor-not-allowed' : ''
									}`}
									disabled={!isEditMode}
								/>
								<span className='text-gray-700'>อื่นๆ:</span>
								<input
									type='text'
									value={otherValue}
									onChange={(e) =>
										handleOtherFieldChange(
											field._id!,
											question.question_id,
											e.target.value
										)
									}
									placeholder='ระบุ...'
									className={`flex-1 px-2 py-1 border border-gray-300 rounded text-sm ${
										!isEditMode ||
										!Array.isArray(questionValue) ||
										!questionValue.includes('other')
											? 'bg-gray-50 cursor-not-allowed'
											: ''
									}`}
									disabled={
										!isEditMode ||
										!Array.isArray(questionValue) ||
										!questionValue.includes('other')
									}
									readOnly={!isEditMode}
								/>
							</div>
						)}
					</div>
				);

			case 'dropdown':
				return (
					<div className='space-y-2'>
						<select
							value={questionValue}
							onChange={(e) =>
								handleFieldChange(field._id!, question.question_id, e.target.value)
							}
							className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
								!isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
							}`}
							disabled={!isEditMode}
						>
							<option value=''>เลือกตัวเลือก...</option>
							{(question.options || []).map((option, index) => (
								<option key={index} value={option}>
									{option}
								</option>
							))}
							{question.allow_other && <option value='other'>อื่นๆ</option>}
						</select>
						{question.allow_other && questionValue === 'other' && (
							<div className='flex items-center gap-2'>
								<span className='text-gray-700'>อื่นๆ:</span>
								<input
									type='text'
									value={otherValue}
									onChange={(e) =>
										handleOtherFieldChange(
											field._id!,
											question.question_id,
											e.target.value
										)
									}
									placeholder='ระบุ...'
									className={`flex-1 px-2 py-1 border border-gray-300 rounded ${
										!isEditMode || questionValue !== 'other'
											? 'bg-gray-50 cursor-not-allowed'
											: ''
									}`}
									disabled={!isEditMode || questionValue !== 'other'}
									readOnly={!isEditMode}
								/>
							</div>
						)}
					</div>
				);

			case 'date':
				return (
					<input
						type='date'
						value={questionValue}
						onChange={(e) =>
							handleFieldChange(field._id!, question.question_id, e.target.value)
						}
						className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
							!isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
						}`}
						disabled={!isEditMode}
						readOnly={!isEditMode}
					/>
				);

			case 'time':
				return (
					<input
						type='time'
						value={questionValue}
						onChange={(e) =>
							handleFieldChange(field._id!, question.question_id, e.target.value)
						}
						className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
							!isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
						}`}
						disabled={!isEditMode}
						readOnly={!isEditMode}
					/>
				);

			case 'table':
				const tableConfig = question.table_config;

				if (!tableConfig) return <p>ตารางไม่ถูกต้อง</p>;

				const tableData = questionValue || {};

				return (
					<div className='overflow-x-auto scrollbar-hide'>
						<table className='w-full border border-gray-300'>
							<tbody>
								{Array.from({ length: tableConfig.rows }).map((_, rowIndex) => (
									<tr key={rowIndex}>
										{Array.from({ length: tableConfig.columns }).map(
											(_, colIndex) => {
												const isHeader = rowIndex === 0 || colIndex === 0;
												const isTopLeft = rowIndex === 0 && colIndex === 0;
												const cellKey = `${rowIndex}_${colIndex}`;

												if (isTopLeft) {
													return (
														<td
															key={cellKey}
															className='border border-gray-300 p-2 bg-gray-100'
														></td>
													);
												}

												// Handle header cells with labels
												if (isHeader) {
													let labelText = '';

													if (rowIndex === 0 && colIndex > 0) {
														// Column header
														labelText =
															tableConfig.column_labels?.[
																colIndex - 1
															] || `คอลัมน์ ${colIndex}`;
													} else if (colIndex === 0 && rowIndex > 0) {
														// Row header
														labelText =
															tableConfig.row_labels?.[
																rowIndex - 1
															] || `แถว ${rowIndex}`;
													}

													return (
														<td
															key={cellKey}
															className='border border-gray-300 p-2 bg-gray-50 font-medium text-center'
														>
															{labelText}
														</td>
													);
												}

												// Regular data cells
												return (
													<td
														key={cellKey}
														className='border border-gray-300 p-1'
													>
														<input
															type='text'
															value={tableData[cellKey] || ''}
															onChange={(e) => {
																const newTableData = {
																	...tableData,
																	[cellKey]: e.target.value,
																};
																handleFieldChange(
																	field._id!,
																	question.question_id,
																	newTableData
																);
															}}
															className={`w-full px-2 py-1 border-none bg-transparent focus:outline-none focus:bg-white ${
																!isEditMode
																	? 'cursor-not-allowed bg-gray-50'
																	: ''
															}`}
															disabled={!isEditMode}
															readOnly={!isEditMode}
														/>
													</td>
												);
											}
										)}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				);

			case 'file_upload':
				return (
					<div className='space-y-2'>
						<input
							type='file'
							onChange={(e) => {
								const files = e.target.files;
								if (files && files.length > 0) {
									handleFieldChange(field._id!, question.question_id, files[0]);
									// Clear the input so same file can be selected again
									e.target.value = '';
								}
							}}
							accept={question.file_types ? question.file_types.join(',') : undefined}
							className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
								!isEditMode ? 'cursor-not-allowed bg-gray-50' : ''
							}`}
							disabled={!isEditMode}
						/>
						{questionValue && (
							<div className='text-sm text-gray-600'>
								<div className='bg-gray-50 p-2 rounded space-y-2'>
									{typeof questionValue === 'string' &&
										isImageFile(questionValue) && (
											<div className='border border-gray-200 rounded-lg p-2 bg-white'>
												<img
													src={getImageUrl(questionValue)}
													alt={questionValue.split('/').pop()}
													className='max-w-sm max-h-48 object-contain rounded'
													onError={(e) => {
														e.currentTarget.style.display = 'none';
													}}
												/>
											</div>
										)}
									{questionValue instanceof File &&
										isImageFile(questionValue.name) && (
											<div className='border border-gray-200 rounded-lg p-2 bg-white'>
												<img
													src={URL.createObjectURL(questionValue)}
													alt={questionValue.name}
													className='max-w-sm max-h-48 object-contain rounded'
													onError={(e) => {
														e.currentTarget.style.display = 'none';
													}}
												/>
											</div>
										)}
									<div className='flex items-center justify-between'>
										<button
											type='button'
											onClick={() => handleFileDownload(questionValue)}
											className='flex-1 text-left text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
										>
											{typeof questionValue === 'string'
												? `ไฟล์ปัจจุบัน: ${questionValue.split('/').pop()}`
												: questionValue instanceof File
												? `ไฟล์ที่เลือก: ${
														questionValue.name
												  } (${Math.round(questionValue.size / 1024)} KB)`
												: 'ไฟล์ที่เลือก'}
										</button>
										<button
											type='button'
											onClick={() => {
												handleFieldChange(
													field._id!,
													question.question_id,
													null
												);
											}}
											className={`ml-2 text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded ${
												!isEditMode ? 'cursor-not-allowed opacity-50' : ''
											}`}
											disabled={!isEditMode}
										>
											ลบ
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				);

			default:
				return <p>ประเภทคำถามไม่รองรับ: {question.question_type}</p>;
		}
	};

	if (isStudentLoading || isFieldsLoading) {
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

	if (isStudentError || !student) {
		return (
			<AuthWrapper>
				<HomeLayout>
					<div className='flex items-center justify-center h-full'>
						<p>ไม่พบข้อมูลนักเรียน</p>
					</div>
				</HomeLayout>
			</AuthWrapper>
		);
	}

	return (
		<AuthWrapper>
			<HomeLayout>
				<div className='w-3/4 h-full flex flex-col mx-auto pt-16 mt-12'>
					<div className='flex items-center justify-between mb-8'>
						<h1 className='text-2xl font-semibold'>
							{isEditMode ? 'กรอกข้อมูลนักเรียน' : 'ข้อมูลนักเรียน'}
						</h1>
					</div>

					{error && (
						<div className='w-1/2 absolute p-3 bg-red -mt-20 border border-red-400 text-red-700 rounded-md'>
							{error}
						</div>
					)}

					<div className='overflow-y-auto h-fit max-h-[65dvh] space-y-6 mb-6 scrollbar-hide'>
						{scholarFields.map((field) => (
							<div
								key={field._id}
								className='bg-white p-6 rounded-lg border border-gray-200'
							>
								<h2 className='text-xl font-semibold mb-2'>{field.field_label}</h2>
								{field.field_description && (
									<p className='text-gray-600 mb-4'>{field.field_description}</p>
								)}

								<div className='space-y-4'>
									{field.questions.map((question) => (
										<div key={question.question_id} className='space-y-2'>
											<label className='block text-sm font-medium text-gray-700'>
												{question.question_label}
												{question.required && (
													<span className='text-red-500 ml-1'>*</span>
												)}
											</label>
											{question.help_text && (
												<p className='text-sm text-gray-500'>
													{question.help_text}
												</p>
											)}
											{renderQuestion(field, question)}
										</div>
									))}
								</div>
							</div>
						))}
					</div>

					<div className='flex justify-end gap-4 w-full'>
						{!isEditMode ? (
							<>
								<button
									onClick={handleBackToScholarDetail}
									className='bg-softblack w-32 text-white text-center px-4 py-2 rounded-xl transition-colors'
								>
									กลับ
								</button>
								<button
									onClick={() => setIsEditMode(true)}
									className='bg-violet-2 w-32 text-white text-center px-4 py-2 rounded-xl transition-colors'
								>
									แก้ไข
								</button>
							</>
						) : (
							<>
								<button
									onClick={handleCancelCreation}
									className='bg-red w-32 text-white text-center px-4 py-2 rounded-xl hover:bg-red-600 transition-colors'
								>
									ยกเลิก
								</button>
								<button
									onClick={handleSaveDraft}
									disabled={isSaving}
									className={`px-4 py-2 w-32 rounded-xl transition-colors bg-green ${
										isSaving
											? 'bg-gray-400 cursor-not-allowed text-white'
											: 'text-white hover:bg-green-600'
									}`}
								>
									{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
								</button>
							</>
						)}
					</div>
				</div>
			</HomeLayout>

			{/* Success Modal */}
			<Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} size='sm'>
				<div className='text-center py-4'>
					<p className='text-black font-semibold text-lg mb-6'>บันทึกสำเร็จ!</p>
					<button
						onClick={() => {
							setShowSuccessModal(false);
							handleBackToScholarDetail();
						}}
						className='px-6 py-2 bg-green text-white rounded-lg'
					>
						ตกลง
					</button>
				</div>
			</Modal>
		</AuthWrapper>
	);
};

export default StudentFormPage;
