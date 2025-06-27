'use client';
import { Question, QuestionType } from '@/types/scholarField';
import Image from 'next/image';
import { FC } from 'react';
import { QuestionTypeDropdown } from './QuestionTypeDropdown';
import { QuestionPreview } from './QuestionPreview';

interface QuestionItemProps {
	question: Question;
	questionIndex: number;
	sectionIndex: number;
	totalQuestions: number;
	isDropdownOpen: boolean;
	sectionFieldName?: string;
	onToggleDropdown: () => void;
	onCloseDropdown: () => void;
	onUpdateQuestionType: (type: QuestionType) => void;
	onUpdateQuestionLabel: (label: string) => void;
	onUpdateQuestionOptions: (options: string[]) => void;
	onUpdateQuestionTableConfig: (config: {
		rows: number;
		columns: number;
		row_labels?: string[];
		column_labels?: string[];
	}) => void;
	onUpdateAllowOther: (allowOther: boolean) => void;
	onUpdateFileConfig: (config: {
		allow_multiple?: boolean;
		file_types?: string[];
	}) => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onDelete: () => void;
}

export const QuestionItem: FC<QuestionItemProps> = ({
	question,
	questionIndex,
	totalQuestions,
	isDropdownOpen,
	sectionFieldName,
	onToggleDropdown,
	onCloseDropdown,
	onUpdateQuestionType,
	onUpdateQuestionLabel,
	onUpdateQuestionOptions,
	onUpdateQuestionTableConfig,
	onUpdateAllowOther,
	onUpdateFileConfig,
	onMoveUp,
	onMoveDown,
	onDelete,
}) => {
	// Check if this is a system required question that cannot be deleted
	const isSystemRequiredQuestion =
		sectionFieldName === 'personal_information' &&
		(question.question_id === 'name' || question.question_id === 'surname');

	return (
		<div className='bg-gray-50 rounded p-3'>
			<div className='flex items-center justify-between mb-2'>
				<input
					type='text'
					value={question.question_label}
					onChange={(e) =>
						!isSystemRequiredQuestion && onUpdateQuestionLabel(e.target.value)
					}
					className={`text-lg font-semibold border-2 border-grey h-10 rounded-md flex-1 px-4 py-2 ${
						isSystemRequiredQuestion ? 'bg-gray-100 cursor-not-allowed' : ''
					}`}
					placeholder='คำถาม'
					readOnly={isSystemRequiredQuestion}
				/>
				<div className='flex gap-1 ml-5'>
					<QuestionTypeDropdown
						selectedType={question.question_type}
						onTypeChange={onUpdateQuestionType}
						isOpen={isDropdownOpen}
						onToggle={onToggleDropdown}
						onClose={onCloseDropdown}
					/>
					{/* Move Up */}
					<button
						type='button'
						onClick={onMoveUp}
						disabled={questionIndex === 0}
						className={`text-xs px-1 py-1 rounded ${
							questionIndex === 0
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
					{/* Move Down */}
					<button
						type='button'
						onClick={onMoveDown}
						disabled={questionIndex === totalQuestions - 1}
						className={`text-xs px-1 py-1 rounded ${
							questionIndex === totalQuestions - 1
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
					{/* Delete Question - Hidden for system required questions */}
					{!isSystemRequiredQuestion ? (
						<button
							type='button'
							onClick={onDelete}
							className='text-xs px-1 py-1 w-8 rounded text-red-600 hover:text-red-800'
						>
							<Image
								src='/assets/delete.svg'
								alt='delete'
								width={13}
								height={19}
								style={{ width: 'auto', height: 'auto' }}
							/>
						</button>
					) : (
						<div className='w-8'></div>
					)}
				</div>
			</div>

			{/* Question Preview with integrated options editing */}
			<QuestionPreview
				question={question}
				onUpdateOptions={onUpdateQuestionOptions}
				onUpdateTableConfig={onUpdateQuestionTableConfig}
				onUpdateAllowOther={onUpdateAllowOther}
				onUpdateFileConfig={onUpdateFileConfig}
			/>
		</div>
	);
};
