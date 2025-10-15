'use client';
import { ScholarField, Question, QuestionType } from '@/types/scholarField';
import Image from 'next/image';
import { FC } from 'react';
import { QuestionItem } from './QuestionItem';

interface SectionItemProps {
	section: ScholarField;
	sectionIndex: number;
	totalSections: number;
	openDropdowns: { [key: string]: boolean };
	onUpdateSectionLabel: (label: string) => void;
	onDeleteSection: () => void;
	onMoveSectionUp: () => void;
	onMoveSectionDown: () => void;
	onAddQuestion: () => void;
	onToggleDropdown: (questionId: string) => void;
	onCloseDropdown: (questionId: string) => void;
	onUpdateQuestionType: (questionId: string, type: QuestionType) => void;
	onUpdateQuestionLabel: (questionId: string, label: string) => void;
	onUpdateQuestionOptions: (questionId: string, options: string[]) => void;
	onUpdateQuestionTableConfig: (questionId: string, config: { rows: number; columns: number; row_labels?: string[]; column_labels?: string[] }) => void;
	onUpdateAllowOther: (questionId: string, allowOther: boolean) => void;
	onUpdateFileConfig: (questionId: string, config: { allow_multiple?: boolean; file_types?: string[] }) => void;
	onMoveQuestionUp: (questionIndex: number) => void;
	onMoveQuestionDown: (questionIndex: number) => void;
	onDeleteQuestion: (questionId: string) => void;
}

export const SectionItem: FC<SectionItemProps> = ({
	section,
	sectionIndex,
	totalSections,
	openDropdowns,
	onUpdateSectionLabel,
	onDeleteSection,
	onMoveSectionUp,
	onMoveSectionDown,
	onAddQuestion,
	onToggleDropdown,
	onCloseDropdown,
	onUpdateQuestionType,
	onUpdateQuestionLabel,
	onUpdateQuestionOptions,
	onUpdateQuestionTableConfig,
	onUpdateAllowOther,
	onUpdateFileConfig,
	onMoveQuestionUp,
	onMoveQuestionDown,
	onDeleteQuestion,
}) => {
	return (
		<div className='bg-white rounded-lg p-4 shadow-sm'>
			<div className='flex items-center justify-between mb-2'>
				<input
					type='text'
					value={section.field_label}
					onChange={(e) => onUpdateSectionLabel(e.target.value)}
					className='text-lg font-semibold border-2 border-grey h-10 rounded-md flex-1 px-4 py-2'
					placeholder='ชื่อหัวข้อ'
				/>
				<div className='flex gap-2 ml-6'>
					{/* Delete Button - Hidden for personal information section */}
					{section.field_name !== 'personal_information' && (
						<button
							type='button'
							onClick={onDeleteSection}
							className='p-1 rounded text-red-600 hover:text-red-800'
						>
							<Image
								src='/assets/delete.svg'
								alt='delete'
								width={16}
								height={16}
								style={{ width: 'auto', height: 'auto' }}
							/>
						</button>
					)}
					{/* Move Up Button */}
					<button
						type='button'
						onClick={onMoveSectionUp}
						disabled={sectionIndex === 0}
						className={`p-1 rounded ${
							sectionIndex === 0
								? 'text-gray-300 cursor-not-allowed'
								: 'text-gray-600 hover:text-blue-600'
						}`}
					>
						<Image
							src='/assets/arrow.svg'
							alt='up'
							width={13}
							height={19}
							style={{ width: 'auto', height: 'auto' }}
						/>
					</button>
					{/* Move Down Button */}
					<button
						type='button'
						onClick={onMoveSectionDown}
						disabled={sectionIndex === totalSections - 1}
						className={`p-1 rounded ${
							sectionIndex === totalSections - 1
								? 'text-gray-300 cursor-not-allowed'
								: 'text-gray-600 hover:text-blue-600'
						}`}
					>
						<Image
							src='/assets/arrow.svg'
							alt='down'
							width={13}
							height={19}
							style={{
								width: 'auto',
								height: 'auto',
								transform: 'rotate(180deg)',
							}}
						/>
					</button>
				</div>
			</div>
			{/* Questions List */}
			<div className='mt-4 ml-8 space-y-2'>
				{section.questions.map((question, qIndex) => (
					<QuestionItem
						key={question.question_id}
						question={question}
						questionIndex={qIndex}
						sectionIndex={sectionIndex}
						totalQuestions={section.questions.length}
						isDropdownOpen={openDropdowns[question.question_id] || false}
						sectionFieldName={section.field_name}
						onToggleDropdown={() => onToggleDropdown(question.question_id)}
						onCloseDropdown={() => onCloseDropdown(question.question_id)}
						onUpdateQuestionType={(type) =>
							onUpdateQuestionType(question.question_id, type)
						}
						onUpdateQuestionLabel={(label) =>
							onUpdateQuestionLabel(question.question_id, label)
						}
						onUpdateQuestionOptions={(options) =>
							onUpdateQuestionOptions(question.question_id, options)
						}
						onUpdateQuestionTableConfig={(config) =>
							onUpdateQuestionTableConfig(question.question_id, config)
						}
						onUpdateAllowOther={(allowOther) =>
							onUpdateAllowOther(question.question_id, allowOther)
						}
						onUpdateFileConfig={(config) =>
							onUpdateFileConfig(question.question_id, config)
						}
						onMoveUp={() => onMoveQuestionUp(qIndex)}
						onMoveDown={() => onMoveQuestionDown(qIndex)}
						onDelete={() => onDeleteQuestion(question.question_id)}
					/>
				))}

				{/* Add Question Button */}
				<button
					type='button'
					onClick={onAddQuestion}
					className='w-full mt-2 py-2 border-2 border-dashed border-violet-3 rounded text-violet-3 flex items-center justify-center'
				>
					<Image
						src='/assets/add.svg'
						alt='add'
						width={16}
						height={16}
						style={{ width: 'auto', height: 'auto' }}
					/>
					เพิ่มคำถาม
				</button>
			</div>
		</div>
	);
};
