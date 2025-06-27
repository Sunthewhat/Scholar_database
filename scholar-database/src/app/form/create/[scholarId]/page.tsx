'use client';
import { AuthWrapper } from '@/components/authWrapper';
import { HomeLayout } from '@/components/layouts/homeLayout';
import { SectionItem } from '@/components/form/SectionItem';
import { ScholarField, Question, QuestionType } from '@/types/scholarField';
import { ScholarFieldResponse } from '@/types/response';
import { Axios } from '@/util/axios';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { FC, useState, useEffect } from 'react';

const CreateFormPage: FC = () => {
	const router = useRouter();
	const params = useParams();
	const scholarId = params.scholarId as string;

	const [sections, setSections] = useState<ScholarField[]>([]);
	const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({});
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [isCheckingExisting, setIsCheckingExisting] = useState(true);

	// Check if scholar already has existing form sections
	useEffect(() => {
		const checkExistingSections = async () => {
			try {
				const response = await Axios.get<ScholarFieldResponse.getAll>(
					`/scholar-field/scholar/${scholarId}`
				);

				if (response.status === 200 && response.data.success && response.data.data.length > 0) {
					// If sections exist, redirect to edit page instead
					router.replace(`/form/edit/${scholarId}`);
					return;
				}
			} catch (error) {
				console.error('Error checking existing sections:', error);
			} finally {
				setIsCheckingExisting(false);
			}
		};

		checkExistingSections();
	}, [scholarId, router]);

	const addSection = () => {
		const defaultQuestion: Question = {
			question_id: `question_${Date.now()}`,
			question_type: 'short_answer',
			question_label: '',
			order: 0,
		};

		const newSection: ScholarField = {
			scholar_id: scholarId,
			field_name: `section_${Date.now()}`,
			field_label: '',
			field_description: '',
			order: sections.length,
			questions: [defaultQuestion],
		};
		setSections([...sections, newSection]);
	};

	const deleteSection = (index: number) => {
		const newSections = sections.filter((_, i) => i !== index);
		// Reorder remaining sections
		const reorderedSections = newSections.map((section, i) => ({
			...section,
			order: i,
		}));
		setSections(reorderedSections);
	};

	const moveSectionUp = (index: number) => {
		if (index === 0) return;
		const newSections = [...sections];
		[newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
		// Update order
		const reorderedSections = newSections.map((section, i) => ({
			...section,
			order: i,
		}));
		setSections(reorderedSections);
	};

	const moveSectionDown = (index: number) => {
		if (index === sections.length - 1) return;
		const newSections = [...sections];
		[newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
		// Update order
		const reorderedSections = newSections.map((section, i) => ({
			...section,
			order: i,
		}));
		setSections(reorderedSections);
	};

	const updateSectionLabel = (index: number, newLabel: string) => {
		const newSections = [...sections];
		newSections[index] = {
			...newSections[index],
			field_label: newLabel,
		};
		setSections(newSections);
	};

	const addQuestion = (sectionIndex: number) => {
		const newQuestion: Question = {
			question_id: `question_${Date.now()}`,
			question_type: 'short_answer',
			question_label: '',
			order: sections[sectionIndex].questions.length,
		};
		const newSections = [...sections];
		newSections[sectionIndex].questions.push(newQuestion);
		setSections(newSections);
	};

	const updateQuestionType = (
		sectionIndex: number,
		questionId: string,
		newType: QuestionType
	) => {
		const newSections = [...sections];
		const questionIndex = newSections[sectionIndex].questions.findIndex(
			(q) => q.question_id === questionId
		);
		if (questionIndex !== -1) {
			const question = newSections[sectionIndex].questions[questionIndex];
			question.question_type = newType;
			// Update label to match new type
			question.question_label = '';
			// Add options for choice-based questions
			if (newType === 'radio' || newType === 'checkbox' || newType === 'dropdown') {
				question.options = [''];
			} else {
				question.options = undefined;
			}
			// Add table config for table questions
			if (newType === 'table') {
				question.table_config = { rows: 2, columns: 2 };
			} else {
				question.table_config = undefined;
			}
			setSections(newSections);
		}
	};

	const deleteQuestion = (sectionIndex: number, questionId: string) => {
		const newSections = [...sections];
		newSections[sectionIndex].questions = newSections[sectionIndex].questions.filter(
			(q) => q.question_id !== questionId
		);
		// Reorder remaining questions
		newSections[sectionIndex].questions = newSections[sectionIndex].questions.map((q, i) => ({
			...q,
			order: i,
		}));
		setSections(newSections);
	};

	const updateQuestionLabel = (sectionIndex: number, questionId: string, newLabel: string) => {
		const newSections = [...sections];
		const questionIndex = newSections[sectionIndex].questions.findIndex(
			(q) => q.question_id === questionId
		);
		if (questionIndex !== -1) {
			newSections[sectionIndex].questions[questionIndex].question_label = newLabel;
			setSections(newSections);
		}
	};

	const updateQuestionOptions = (
		sectionIndex: number,
		questionId: string,
		newOptions: string[]
	) => {
		const newSections = [...sections];
		const questionIndex = newSections[sectionIndex].questions.findIndex(
			(q) => q.question_id === questionId
		);
		if (questionIndex !== -1) {
			newSections[sectionIndex].questions[questionIndex].options = newOptions;
			setSections(newSections);
		}
	};

	const updateQuestionTableConfig = (
		sectionIndex: number,
		questionId: string,
		newConfig: {
			rows: number;
			columns: number;
			row_labels?: string[];
			column_labels?: string[];
		}
	) => {
		const newSections = [...sections];
		const questionIndex = newSections[sectionIndex].questions.findIndex(
			(q) => q.question_id === questionId
		);
		if (questionIndex !== -1) {
			newSections[sectionIndex].questions[questionIndex].table_config = newConfig;
			setSections(newSections);
		}
	};

	const updateQuestionAllowOther = (
		sectionIndex: number,
		questionId: string,
		allowOther: boolean
	) => {
		const newSections = [...sections];
		const questionIndex = newSections[sectionIndex].questions.findIndex(
			(q) => q.question_id === questionId
		);
		if (questionIndex !== -1) {
			newSections[sectionIndex].questions[questionIndex].allow_other = allowOther;
			setSections(newSections);
		}
	};

	const updateQuestionFileConfig = (
		sectionIndex: number,
		questionId: string,
		config: { allow_multiple?: boolean; file_types?: string[] }
	) => {
		const newSections = [...sections];
		const questionIndex = newSections[sectionIndex].questions.findIndex(
			(q) => q.question_id === questionId
		);
		if (questionIndex !== -1) {
			newSections[sectionIndex].questions[questionIndex].allow_multiple = config.allow_multiple;
			newSections[sectionIndex].questions[questionIndex].file_types = config.file_types;
			setSections(newSections);
		}
	};

	const moveQuestionUp = (sectionIndex: number, questionIndex: number) => {
		if (questionIndex === 0) return;
		const newSections = [...sections];
		const questions = newSections[sectionIndex].questions;
		[questions[questionIndex - 1], questions[questionIndex]] = [
			questions[questionIndex],
			questions[questionIndex - 1],
		];
		// Update order
		newSections[sectionIndex].questions = questions.map((q, i) => ({ ...q, order: i }));
		setSections(newSections);
	};

	const moveQuestionDown = (sectionIndex: number, questionIndex: number) => {
		const questions = sections[sectionIndex].questions;
		if (questionIndex === questions.length - 1) return;
		const newSections = [...sections];
		const sectionQuestions = newSections[sectionIndex].questions;
		[sectionQuestions[questionIndex], sectionQuestions[questionIndex + 1]] = [
			sectionQuestions[questionIndex + 1],
			sectionQuestions[questionIndex],
		];
		// Update order
		newSections[sectionIndex].questions = sectionQuestions.map((q, i) => ({ ...q, order: i }));
		setSections(newSections);
	};

	// Handle dropdown toggle
	const toggleDropdown = (questionId: string) => {
		setOpenDropdowns((prev) => ({
			...prev,
			[questionId]: !prev[questionId],
		}));
	};

	// Close dropdown when clicking outside
	const closeDropdown = (questionId: string) => {
		setOpenDropdowns((prev) => ({
			...prev,
			[questionId]: false,
		}));
	};

	const handleSave = async () => {
		// Validate that we have at least one section
		if (sections.length === 0) {
			setSaveError('กรุณาเพิ่มอย่างน้อย 1 หัวข้อ');
			return;
		}

		// Validate that all sections have labels and questions
		for (let i = 0; i < sections.length; i++) {
			const section = sections[i];
			if (!section.field_label.trim()) {
				setSaveError(`กรุณากรอกชื่อหัวข้อที่ ${i + 1}`);
				return;
			}
			if (section.questions.length === 0) {
				setSaveError(`กรุณาเพิ่มคำถามในหัวข้อ "${section.field_label}"`);
				return;
			}
			
			// Validate questions
			for (let j = 0; j < section.questions.length; j++) {
				const question = section.questions[j];
				if (!question.question_label.trim()) {
					setSaveError(`กรุณากรอกคำถามที่ ${j + 1} ในหัวข้อ "${section.field_label}"`);
					return;
				}
				
				// Validate choice-based questions have options
				if (['radio', 'checkbox', 'dropdown'].includes(question.question_type)) {
					if (!question.options || question.options.length === 0 || question.options.every(opt => !opt.trim())) {
						setSaveError(`กรุณาเพิ่มตัวเลือกสำหรับคำถาม "${question.question_label}"`);
						return;
					}
				}
			}
		}

		setSaveError(null);
		setIsSaving(true);

		try {
			// Save each section to the backend
			const savePromises = sections.map(async (section) => {
				const response = await Axios.post<ScholarFieldResponse.create>('/scholar-field', {
					scholar_id: scholarId,
					field_name: section.field_name,
					field_label: section.field_label,
					field_description: section.field_description || '',
					order: section.order,
					questions: section.questions.map(q => ({
						question_id: q.question_id,
						question_type: q.question_type,
						question_label: q.question_label,
						required: q.required || false,
						options: q.options || [],
						allow_other: ['radio', 'checkbox', 'dropdown'].includes(q.question_type) ? q.allow_other || false : undefined,
						table_config: q.table_config,
						allow_multiple: q.question_type === 'file_upload' ? q.allow_multiple : undefined,
						file_types: q.question_type === 'file_upload' ? q.file_types : undefined,
						order: q.order,
						placeholder: q.placeholder,
						help_text: q.help_text,
						validation: q.validation
					}))
				});

				if (response.status !== 200 || !response.data.success) {
					throw new Error(response.data.msg || 'เกิดข้อผิดพลาดในการบันทึก');
				}

				return response.data.data;
			});

			await Promise.all(savePromises);
			
			// Navigate back to home with success
			router.push('/?saved=true');

		} catch (error: any) {
			console.error('Save error:', error);
			const errorMessage = error.response?.data?.msg || error.message || 'เกิดข้อผิดพลาดในการบันทึกฟอร์ม';
			setSaveError(errorMessage);
		} finally {
			setIsSaving(false);
		}
	};
	// Show loading while checking for existing sections
	if (isCheckingExisting) {
		return (
			<AuthWrapper>
				<HomeLayout>
					<div className='flex items-center justify-center h-full'>
						<p>กำลังตรวจสอบข้อมูลฟอร์ม...</p>
					</div>
				</HomeLayout>
			</AuthWrapper>
		);
	}

	return (
		<AuthWrapper>
			<HomeLayout>
				<div className='w-3/4 h-full flex flex-col mx-auto pt-16 mt-20'>
					<h1 className='text-2xl font-semibold text-center mb-8'>
						สร้างฟอร์มกรอกข้อมูล
					</h1>
					<div className='w-full flex justify-end'>
						<button className='flex gap-4 bg-violet-3 text-white px-6 py-2 rounded-xl'>
							<Image
								src='/assets/eye.svg'
								alt='eye'
								width={10}
								height={10}
								className=''
								style={{
									width: 'auto',
									height: 'auto',
								}}
							/>
							<h1>ดูตัวอย่างฟอร์ม</h1>
						</button>
					</div>
					<div className='h-2/3 overflow-y-scroll rounded-lg bg-gray-50 mt-5 mb-5'>
						{sections.length === 0 ? (
							<div className='flex items-center justify-center h-full text-gray-500'>
								<p>ยังไม่มีหัวข้อ กดปุ่ม &quot;เพิ่มหัวข้อ&quot; เพื่อเริ่มต้น</p>
							</div>
						) : (
							<div className='space-y-4'>
								{sections.map((section, index) => (
									<SectionItem
										key={index}
										section={section}
										sectionIndex={index}
										totalSections={sections.length}
										openDropdowns={openDropdowns}
										onUpdateSectionLabel={(label) =>
											updateSectionLabel(index, label)
										}
										onDeleteSection={() => deleteSection(index)}
										onMoveSectionUp={() => moveSectionUp(index)}
										onMoveSectionDown={() => moveSectionDown(index)}
										onAddQuestion={() => addQuestion(index)}
										onToggleDropdown={toggleDropdown}
										onCloseDropdown={closeDropdown}
										onUpdateQuestionType={(questionId, type) =>
											updateQuestionType(index, questionId, type)
										}
										onUpdateQuestionLabel={(questionId, label) =>
											updateQuestionLabel(index, questionId, label)
										}
										onUpdateQuestionOptions={(questionId, options) =>
											updateQuestionOptions(index, questionId, options)
										}
										onUpdateQuestionTableConfig={(questionId, config) =>
											updateQuestionTableConfig(index, questionId, config)
										}
										onUpdateAllowOther={(questionId, allowOther) =>
											updateQuestionAllowOther(index, questionId, allowOther)
										}
										onUpdateFileConfig={(questionId, config) =>
											updateQuestionFileConfig(index, questionId, config)
										}
										onMoveQuestionUp={(questionIndex) =>
											moveQuestionUp(index, questionIndex)
										}
										onMoveQuestionDown={(questionIndex) =>
											moveQuestionDown(index, questionIndex)
										}
										onDeleteQuestion={(questionId) =>
											deleteQuestion(index, questionId)
										}
									/>
								))}
								<div className='h-40 w-full'></div>
							</div>
						)}
					</div>
					{/* Error message */}
					{saveError && (
						<div className='w-full mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md'>
							{saveError}
						</div>
					)}

					<div className='w-full flex justify-between'>
						<button
							onClick={handleSave}
							type='button'
							disabled={isSaving}
							className={`w-32 py-2 text-white rounded-xl transition-colors ${
								isSaving 
									? 'bg-gray-400 cursor-not-allowed' 
									: 'bg-green hover:bg-green-600'
							}`}
						>
							<h1>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</h1>
						</button>
						<button
							onClick={addSection}
							type='button'
							disabled={isSaving}
							className={`w-32 text-white flex py-2 justify-center gap-2 rounded-xl transition-colors ${
								isSaving 
									? 'bg-gray-400 cursor-not-allowed' 
									: 'bg-violet-3 hover:bg-blue-600'
							}`}
						>
							<Image
								src='/assets/add.svg'
								alt='add'
								width={10}
								height={10}
								className='w-4 h-4'
								style={{ width: 'auto', height: 'auto' }}
							/>
							<h1>เพิ่มหัวข้อ</h1>
						</button>
					</div>
				</div>
			</HomeLayout>
		</AuthWrapper>
	);
};

export default CreateFormPage;
