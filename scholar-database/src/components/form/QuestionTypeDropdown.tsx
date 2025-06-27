'use client';
import { QuestionType } from '@/types/scholarField';
import Image from 'next/image';
import { FC, useRef, useEffect } from 'react';

const questionTypes: { type: QuestionType; label: string }[] = [
	{ type: 'short_answer', label: 'คำตอบสั้น' },
	{ type: 'long_answer', label: 'คำตอบยาว' },
	{ type: 'radio', label: 'ตัวเลือกเดียว' },
	{ type: 'checkbox', label: 'หลายตัวเลือก' },
	{ type: 'dropdown', label: 'เมนูแบบเลื่อนลง' },
	{ type: 'table', label: 'ตาราง' },
	{ type: 'date', label: 'วันที่' },
	{ type: 'time', label: 'เวลา' },
	{ type: 'file_upload', label: 'อัปโหลดไฟล์' },
];

interface QuestionTypeDropdownProps {
	selectedType: QuestionType;
	onTypeChange: (type: QuestionType) => void;
	isOpen: boolean;
	onToggle: () => void;
	onClose: () => void;
}

export const QuestionTypeDropdown: FC<QuestionTypeDropdownProps> = ({
	selectedType,
	onTypeChange,
	isOpen,
	onToggle,
	onClose,
}) => {
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				isOpen &&
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [isOpen, onClose]);

	const currentType = questionTypes.find((qt) => qt.type === selectedType);

	return (
		<div className='relative' ref={dropdownRef}>
			<button
				onClick={onToggle}
				className='flex items-center gap-2 w-52 px-4 py-2 bg-white border-violet-3 border-[2px] rounded-md h-10 text-violet-3 font-semibold hover:bg-gray-50 transition-colors'
			>
				<Image
					src={`/assets/answers/${selectedType}.svg`}
					alt={selectedType}
					width={16}
					height={16}
					style={{
						width: 'auto',
						height: 'auto',
					}}
				/>
				{currentType?.label}
			</button>
			{isOpen && (
				<div className='absolute top-full left-0 mt-1 w-52 bg-white border-violet-3 border-[2px] rounded-lg shadow-lg z-30'>
					{questionTypes.map((qType) => (
						<button
							key={qType.type}
							onClick={() => {
								onTypeChange(qType.type);
								onClose();
							}}
							className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors ${
								selectedType === qType.type
									? 'bg-violet-3 text-white'
									: 'text-violet-3 hover:bg-gray-100'
							} ${qType === questionTypes[0] ? 'rounded-t-md' : ''} ${
								qType === questionTypes[questionTypes.length - 1]
									? 'rounded-b-md'
									: ''
							}`}
						>
							<Image
								src={`/assets/answers/${qType.type}.svg`}
								alt={qType.type}
								width={16}
								height={16}
								style={{
									width: 'auto',
									height: 'auto',
									filter:
										qType.type === selectedType
											? 'brightness(0) saturate(100%) invert(99%) sepia(3%) saturate(82%) hue-rotate(58deg) brightness(118%) contrast(100%)'
											: '',
								}}
							/>
							<span className='text-xs font-medium'>{qType.label}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
};
