'use client';
import { Modal } from '@/components/modal';
import { Student } from '@/types/student';
import { ScholarField, Question } from '@/types/scholarField';
import { ScholarFieldResponse } from '@/types/response';
import { Axios } from '@/util/axios';
import { submitFormWithFiles, extractFilesFromFormData } from '@/utils/formData';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FC, useState, useEffect } from 'react';
import { HomeLayout } from '@/components/layouts/homeLayout';

const TempStudentFormPage: FC = () => {
	const router = useRouter();
	const params = useParams();
	const searchParams = useSearchParams();
	const studentId = params.studentId as string;
	const token = searchParams.get('token');

	// State management
	const [student, setStudent] = useState<Student | null>(null);
	const [scholarFields, setScholarFields] = useState<ScholarField[]>([]);
	const [formData, setFormData] = useState<Record<string, any>>({});
	const [isLoading, setIsLoading] = useState(true);
	const [isFieldsLoading, setIsFieldsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [showConsentModal, setShowConsentModal] = useState(false);
	const [isTokenValid, setIsTokenValid] = useState(false);

	// Verify token and load student data
	useEffect(() => {
		const verifyTokenAndLoadData = async () => {
			if (!token) {
				setError('ไม่พบ Token การเข้าถึง');
				setIsLoading(false);
				return;
			}

			try {
				setIsLoading(true);

				// Verify token
				const verifyResponse = await Axios.post('/student/temp-permission/verify', {
					token: token,
					student_id: studentId,
				});

				if (verifyResponse.status === 200 && verifyResponse.data.success) {
					setIsTokenValid(true);
					setStudent(verifyResponse.data.data.student);
				} else {
					setError(verifyResponse.data.msg || 'Token ไม่ถูกต้องหรือหมดอายุ');
					setIsLoading(false);
					return;
				}
			} catch (err: any) {
				console.error('Error verifying token:', err);
				setError(err.response?.data?.msg || 'ไม่สามารถตรวจสอบ Token ได้');
				setIsLoading(false);
				return;
			}
		};

		verifyTokenAndLoadData();
	}, [token, studentId]);

	// Initialize form data when student data is loaded
	useEffect(() => {
		if (student && !formData.initialized) {
			setFormData({ ...student.form_data, initialized: true });
		}
	}, [student, formData.initialized]);

	// Fetch scholar fields when student data is available
	useEffect(() => {
		const fetchScholarFields = async () => {
			if (!student || !isTokenValid) return;

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
				setIsLoading(false);
			} catch (err: any) {
				console.error('Error fetching scholar fields:', err);
				setError(err.response?.data?.msg || 'เกิดข้อผิดพลาดในการดึงข้อมูลฟิลด์');
				setIsLoading(false);
			} finally {
				setIsFieldsLoading(false);
			}
		};

		fetchScholarFields();
	}, [student, isTokenValid]);

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

	// Show consent modal before saving
	const handleSaveClick = () => {
		setShowConsentModal(true);
	};

	// Save form after consent
	const handleSaveForm = async () => {
		try {
			setIsSaving(true);
			setShowConsentModal(false);

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
				setShowSuccessModal(true);
			} else {
				setError(response.data.msg || 'เกิดข้อผิดพลาดในการบันทึก');
			}
		} catch (err: any) {
			console.error('Error saving form:', err);
			setError(err.response?.data?.msg || 'เกิดข้อผิดพลาดในการบันทึก');
		} finally {
			setIsSaving(false);
		}
	};

	const handleConsentCancel = () => {
		setShowConsentModal(false);
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
						className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
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
						className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
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
									className='h-4 w-4 text-blue-600 mr-3'
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
									className='h-4 w-4 text-blue-600 mr-3'
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
									className='flex-1 px-2 py-1 border border-gray-300 rounded text-sm'
									disabled={questionValue !== 'other'}
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
										className='h-4 w-4 text-blue-600 rounded mr-3'
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
									className='h-4 w-4 text-blue-600 rounded mr-3'
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
									className='flex-1 px-2 py-1 border border-gray-300 rounded text-sm'
									disabled={
										!Array.isArray(questionValue) ||
										!questionValue.includes('other')
									}
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
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
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
									className='flex-1 px-2 py-1 border border-gray-300 rounded'
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
						className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
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
						className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
				);

			case 'table':
				const tableConfig = question.table_config;

				if (!tableConfig) return <p>ตารางไม่ถูกต้อง</p>;

				const tableData = questionValue || {};

				return (
					<div className='overflow-x-auto'>
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
															className='w-full px-2 py-1 border-none bg-transparent focus:outline-none focus:bg-white'
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
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
						/>
						{questionValue && (
							<div className='text-sm text-gray-600'>
								<div className='flex items-center justify-between bg-gray-50 p-2 rounded'>
									<span className='flex-1'>
										{typeof questionValue === 'string'
											? `ไฟล์ปัจจุบัน: ${questionValue.split('/').pop()}`
											: questionValue instanceof File
											? `ไฟล์ที่เลือก: ${questionValue.name} (${Math.round(
													questionValue.size / 1024
											  )} KB)`
											: 'ไฟล์ที่เลือก'}
									</span>
									<button
										type='button'
										onClick={() => {
											handleFieldChange(
												field._id!,
												question.question_id,
												null
											);
										}}
										className='ml-2 text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded'
									>
										ลบ
									</button>
								</div>
							</div>
						)}
					</div>
				);

			default:
				return <p>ประเภทคำถามไม่รองรับ: {question.question_type}</p>;
		}
	};

	if (isLoading || isFieldsLoading) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
					<p className='text-gray-600'>กำลังโหลด...</p>
				</div>
			</div>
		);
	}

	if (error || !isTokenValid) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='text-center max-w-md mx-auto p-8'>
					<div className='bg-white rounded-lg shadow-lg p-6'>
						<h1 className='text-2xl font-bold text-red-600 mb-4'>
							ไม่สามารถเข้าถึงได้
						</h1>
						<p className='text-gray-700 mb-4'>{error || 'เกิดข้อผิดพลาด'}</p>
						<p className='text-sm text-gray-500'>
							กรุณาติดต่อผู้ดูแลระบบเพื่อขอลิ้งค์ใหม่
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (!student) {
		return (
			<div className='min-h-screen bg-gray-50 flex items-center justify-center'>
				<div className='text-center'>
					<p className='text-gray-700'>ไม่พบข้อมูลนักเรียน</p>
				</div>
			</div>
		);
	}

	return (
		<HomeLayout>
			<div className='min-h-screen bg-gray-50'>
				<div className='w-3/4 h-full flex flex-col mx-auto pt-20'>
					<div className='flex items-center justify-between mb-8'>
						<h1 className='text-2xl font-semibold'>แก้ไขฟอร์มข้อมูล</h1>
					</div>

					{error && (
						<div className='w-1/2 absolute p-3 bg-red-100 -mt-20 border border-red-400 text-red-700 rounded-md'>
							{error}
						</div>
					)}

					<div className='overflow-y-auto h-fit max-h-[65dvh] space-y-6 mb-6'>
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

					<div className='flex justify-center gap-4 w-full mb-8'>
						<button
							onClick={handleSaveClick}
							disabled={isSaving}
							className={`px-8 py-3 w-48 rounded-xl transition-colors bg-green ${
								isSaving
									? 'bg-gray-400 cursor-not-allowed text-white'
									: 'text-white hover:bg-green-600'
							}`}
						>
							{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
						</button>
					</div>
				</div>

				{/* Consent Modal */}
				<Modal isOpen={showConsentModal} onClose={handleConsentCancel} size='md'>
					<div className='text-center py-6'>
						<h2 className='text-xl font-semibold text-black mb-4'>
							ยินยอมการเก็บรักษาข้อมูล
						</h2>
						<div className='text-left text-gray-700 mb-6 space-y-3'>
							<p>
								เพื่อการประมวลผลข้อมูลทุนการศึกษา
								ทางเราจำเป็นต้องเก็บรักษาข้อมูลส่วนบุคคลของท่าน ซึ่งรวมถึง:
							</p>
							<ul className='list-disc pl-6 space-y-1'>
								<li>ข้อมูลส่วนตัว เช่น ชื่อ-นามสกุล ที่อยู่ เบอร์โทรศัพท์</li>
								<li>ข้อมูลการศึกษาและผลการเรียน</li>
								<li>เอกสารและไฟล์ที่ท่านอัปโหลด</li>
								<li>ข้อมูลอื่นๆ ที่ท่านให้ไว้ในแบบฟอร์มนี้</li>
							</ul>
							<p>
								ข้อมูลของท่านจะถูกเก็บรักษาอย่างปลอดภัยและใช้เพื่อวัตถุประสงค์ในการประมวลผลทุนการศึกษาเท่านั้น
							</p>
						</div>
						<div className='flex gap-4 justify-center'>
							<button
								onClick={handleConsentCancel}
								className='px-6 py-2 bg-grey text-white rounded-lg hover:bg-gray-600 transition-colors'
							>
								ไม่ยินยอม
							</button>
							<button
								onClick={handleSaveForm}
								disabled={isSaving}
								className={`px-6 py-2 rounded-lg transition-colors ${
									isSaving
										? 'bg-gray-400 cursor-not-allowed text-white'
										: 'bg-green text-white hover:bg-green-600'
								}`}
							>
								{isSaving ? 'กำลังบันทึก...' : 'ยินยอมและบันทึกข้อมูล'}
							</button>
						</div>
					</div>
				</Modal>

				{/* Success Modal */}
				<Modal
					isOpen={showSuccessModal}
					onClose={() => setShowSuccessModal(false)}
					size='sm'
				>
					<div className='text-center py-4'>
						<p className='text-black font-semibold text-lg mb-6'>บันทึกสำเร็จ!</p>
						<p className='text-gray-600 mb-6'>ข้อมูลของคุณได้รับการบันทึกแล้ว</p>
						<button
							onClick={() => setShowSuccessModal(false)}
							className='px-6 py-2 bg-green text-white rounded-lg'
						>
							ตกลง
						</button>
					</div>
				</Modal>
			</div>
		</HomeLayout>
	);
};

export default TempStudentFormPage;
