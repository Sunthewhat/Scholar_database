'use client';
import { Question } from '@/types/scholarField';
import { FC } from 'react';
import Image from 'next/image';

interface QuestionPreviewProps {
	question: Question;
	onUpdateOptions?: (options: string[]) => void;
	onUpdateTableConfig?: (config: {
		rows: number;
		columns: number;
		row_labels?: string[];
		column_labels?: string[];
	}) => void;
	onUpdateAllowOther?: (allowOther: boolean) => void;
	onUpdateFileConfig?: (config: {
		allow_multiple?: boolean;
		file_types?: string[];
	}) => void;
}

export const QuestionPreview: FC<QuestionPreviewProps> = ({
	question,
	onUpdateOptions,
	onUpdateTableConfig,
	onUpdateAllowOther,
	onUpdateFileConfig,
}) => {
	const addOption = () => {
		if (onUpdateOptions) {
			const currentOptions = question.options || ['ตัวเลือก 1'];
			const newOptions = [...currentOptions, ''];
			onUpdateOptions(newOptions);
		}
	};

	const deleteOption = (index: number) => {
		if (onUpdateOptions && question.options && question.options.length > 1) {
			const newOptions = question.options.filter((_, i) => i !== index);
			onUpdateOptions(newOptions);
		}
	};

	const updateOption = (index: number, value: string) => {
		if (onUpdateOptions && question.options) {
			const newOptions = [...question.options];
			newOptions[index] = value;
			onUpdateOptions(newOptions);
		}
	};

	const updateRowLabel = (index: number, value: string) => {
		if (onUpdateTableConfig && question.table_config) {
			const currentConfig = question.table_config;
			const newRowLabels = [...(currentConfig.row_labels || [])];
			newRowLabels[index] = value;
			onUpdateTableConfig({
				...currentConfig,
				row_labels: newRowLabels,
			});
		}
	};

	const updateColumnLabel = (index: number, value: string) => {
		if (onUpdateTableConfig && question.table_config) {
			const currentConfig = question.table_config;
			const newColumnLabels = [...(currentConfig.column_labels || [])];
			newColumnLabels[index] = value;
			onUpdateTableConfig({
				...currentConfig,
				column_labels: newColumnLabels,
			});
		}
	};

	const updateTableSize = (rows: number, columns: number) => {
		if (onUpdateTableConfig && question.table_config) {
			const currentConfig = question.table_config;
			onUpdateTableConfig({
				...currentConfig,
				rows,
				columns,
			});
		}
	};
	const renderPreview = () => {
		switch (question.question_type) {
			case 'short_answer':
				return (
					<input
						type='text'
						placeholder='ข้อความสั้น...'
						className='w-full px-3 py-2 border border-grey rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						disabled
					/>
				);

			case 'long_answer':
				return (
					<textarea
						placeholder='ข้อความยาว...'
						rows={4}
						className='w-full px-3 py-2 border border-grey rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
						disabled
					/>
				);

			case 'radio':
				const radioOptions = question.options || [''];
				return (
					<div className='flex w-full gap-10 justify-between'>
						<div className='flex-1'>
							{radioOptions.map((option, index) => (
								<div key={index} className='flex items-center mb-3'>
									<input
										type='radio'
										name={`radio-${question.question_id}`}
										className='h-4 w-4 text-blue-600 mr-4'
										disabled
									/>
									{onUpdateOptions ? (
										<div className='flex items-center gap-2 flex-1'>
											<input
												type='text'
												value={option}
												onChange={(e) =>
													updateOption(index, e.target.value)
												}
												className='text-lg font-semibold border-2 border-grey h-10 flex-1 rounded-md px-4 py-2'
												placeholder={`ตัวเลือก ${index + 1}`}
											/>
											{radioOptions.length > 1 ? (
												<button
													type='button'
													onClick={() => deleteOption(index)}
													className='w-10 h-10'
													title='ลบตัวเลือก'
												>
													<Image
														src='/assets/delete.svg'
														alt='delete'
														width={12}
														height={12}
														style={{ width: 'auto', height: 'auto' }}
													/>
												</button>
											) : (
												<div className='w-10 h-10'></div>
											)}
										</div>
									) : (
										<span className='text-gray-700'>{option}</span>
									)}
								</div>
							))}
							{/* Other option - only show if allow_other is true */}
							{question.allow_other && (
								<div className='flex items-center mb-3'>
									<input
										type='radio'
										name={`radio-${question.question_id}`}
										className='h-4 w-4 text-blue-600 mr-4'
										disabled
									/>
									<div className='flex items-center gap-2 flex-1'>
										<span className='text-gray-700'>อื่นๆ</span>
										<input
											type='text'
											placeholder='ระบุ...'
											className='text-lg border-2 border-grey h-10 px-4 py-2 rounded-md bg-gray-50'
											disabled
										/>
									</div>
								</div>
							)}
						</div>
						<div className='flex flex-col gap-2 items-end'>
							{onUpdateOptions && (
								<button
									type='button'
									onClick={addOption}
									className='flex items-center justify-center bg-violet-3 w-6 h-6 rounded'
								>
									<Image
										src='/assets/add.svg'
										alt='add'
										width={12}
										height={12}
										style={{ width: 'auto', height: 'auto' }}
									/>
								</button>
							)}
							{onUpdateAllowOther && (
								<div className='flex items-center gap-2 text-sm'>
									<input
										type='checkbox'
										id={`allow-other-${question.question_id}`}
										checked={question.allow_other || false}
										onChange={(e) => onUpdateAllowOther(e.target.checked)}
										className='h-4 w-4 accent-violet-3 border-violet-3'
									/>
									<label
										htmlFor={`allow-other-${question.question_id}`}
										className='text-gray-600'
									>
										แสดง &quot;อื่นๆ&quot;
									</label>
								</div>
							)}
						</div>
					</div>
				);

			case 'checkbox':
				const checkboxOptions = question.options || [''];
				return (
					<div className='flex w-full gap-10 justify-between'>
						<div className='flex-1'>
							{checkboxOptions.map((option, index) => (
								<div key={index} className='flex items-center mb-3'>
									<input
										type='checkbox'
										className='h-4 w-4 text-blue-600 rounded mr-4'
										disabled
									/>
									{onUpdateOptions ? (
										<div className='flex items-center gap-2 flex-1'>
											<input
												type='text'
												value={option}
												onChange={(e) =>
													updateOption(index, e.target.value)
												}
												className='text-lg font-semibold border-2 border-grey h-10 flex-1 rounded-md px-4 py-2'
												placeholder={`ตัวเลือก ${index + 1}`}
											/>
											{checkboxOptions.length > 1 ? (
												<button
													type='button'
													onClick={() => deleteOption(index)}
													className='w-10 h-10'
													title='ลบตัวเลือก'
												>
													<Image
														src='/assets/delete.svg'
														alt='delete'
														width={12}
														height={12}
														style={{ width: 'auto', height: 'auto' }}
													/>
												</button>
											) : (
												<div className='w-10 h-10'></div>
											)}
										</div>
									) : (
										<span className='text-gray-700'>{option}</span>
									)}
								</div>
							))}
							{/* Other option - only show if allow_other is true */}
							{question.allow_other && (
								<div className='flex items-center mb-3'>
									<input
										type='checkbox'
										className='h-4 w-4 text-blue-600 rounded mr-4'
										disabled
									/>
									<div className='flex items-center gap-2 flex-1'>
										<span className='text-gray-700'>อื่นๆ</span>
										<input
											type='text'
											placeholder='ระบุ...'
											className='text-lg border-2 border-grey h-10 px-4 py-2 rounded-md bg-gray-50'
											disabled
										/>
									</div>
								</div>
							)}
						</div>
						<div className='flex flex-col gap-2 items-end'>
							{onUpdateOptions && (
								<button
									type='button'
									onClick={addOption}
									className='flex items-center justify-center bg-violet-3 w-6 h-6 rounded'
								>
									<Image
										src='/assets/add.svg'
										alt='add'
										width={12}
										height={12}
										style={{ width: 'auto', height: 'auto' }}
									/>
								</button>
							)}
							{onUpdateAllowOther && (
								<div className='flex items-center gap-2 text-sm'>
									<input
										type='checkbox'
										id={`allow-other-checkbox-${question.question_id}`}
										checked={question.allow_other || false}
										onChange={(e) => onUpdateAllowOther(e.target.checked)}
										className='h-4 w-4 text-violet-3 border-violet-3 border-2 rounded focus:ring-violet-3 focus:ring-2'
									/>
									<label
										htmlFor={`allow-other-checkbox-${question.question_id}`}
										className='text-gray-600'
									>
										แสดง &quot;อื่นๆ&quot;
									</label>
								</div>
							)}
						</div>
					</div>
				);

			case 'dropdown':
				const dropdownOptions = question.options || [''];
				return (
					<div className='space-y-3'>
						<select
							className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
							disabled
						>
							<option>เลือกตัวเลือก...</option>
							{dropdownOptions.map((option, index) => (
								<option key={index} value={option}>
									{option}
								</option>
							))}
							{question.allow_other && <option value='other'>อื่นๆ</option>}
						</select>
						{/* Other input field preview - only show if allow_other is true */}
						{question.allow_other && (
							<div className='flex items-center gap-2 mt-2'>
								<span className='text-gray-700'>อื่นๆ:</span>
								<input
									type='text'
									placeholder='ระบุ...'
									className='text-lg border-2 border-grey h-10 px-4 py-2 rounded-md bg-gray-50 flex-1'
									disabled
								/>
							</div>
						)}
						{onUpdateOptions && (
							<div className='flex w-full gap-10 justify-between'>
								<div className='flex-1 space-y-3'>
									{dropdownOptions.map((option, index) => (
										<div key={index} className='flex items-center gap-2'>
											<span className='text-sm text-gray-500 w-6'>
												{index + 1}.
											</span>
											<input
												type='text'
												value={option}
												onChange={(e) =>
													updateOption(index, e.target.value)
												}
												className='text-lg font-semibold border-2 border-grey h-10 flex-1 rounded-md px-4 py-2'
												placeholder={`ตัวเลือก ${index + 1}`}
											/>
											{dropdownOptions.length > 1 ? (
												<button
													type='button'
													onClick={() => deleteOption(index)}
													className='w-10 h-10'
													title='ลบตัวเลือก'
												>
													<Image
														src='/assets/delete.svg'
														alt='delete'
														width={12}
														height={12}
														style={{ width: 'auto', height: 'auto' }}
													/>
												</button>
											) : (
												<div className='w-10 h-10'></div>
											)}
										</div>
									))}
								</div>
								<div className='flex flex-col gap-2 items-end'>
									<button
										type='button'
										onClick={addOption}
										className='flex items-center justify-center bg-violet-3 w-6 h-6 rounded'
									>
										<Image
											src='/assets/add.svg'
											alt='add'
											width={12}
											height={12}
											style={{ width: 'auto', height: 'auto' }}
										/>
									</button>
									{onUpdateAllowOther && (
										<div className='flex items-center gap-2 text-sm'>
											<input
												type='checkbox'
												id={`allow-other-dropdown-${question.question_id}`}
												checked={question.allow_other || false}
												onChange={(e) =>
													onUpdateAllowOther(e.target.checked)
												}
												className='h-4 w-4 text-violet-3 border-violet-3 border-2 rounded focus:ring-violet-3 focus:ring-2'
											/>
											<label
												htmlFor={`allow-other-dropdown-${question.question_id}`}
												className='text-gray-600'
											>
												แสดง &quot;อื่นๆ&quot;
											</label>
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				);

			case 'table':
				const rows = question.table_config?.rows || 2;
				const columns = question.table_config?.columns || 2;
				const rowLabels = question.table_config?.row_labels || [];
				const columnLabels = question.table_config?.column_labels || [];

				return (
					<div className='space-y-3'>
						{onUpdateTableConfig && (
							<div className='flex gap-4 p-3 bg-gray-50 rounded'>
								<div className='flex items-center gap-2'>
									<label className='text-xs font-medium text-gray-700'>
										แถว:
									</label>
									<input
										type='number'
										min='2'
										max='10'
										value={rows}
										onChange={(e) =>
											updateTableSize(parseInt(e.target.value) || 2, columns)
										}
										className='w-16 px-2 py-1 text-xs border border-grey rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
									/>
								</div>
								<div className='flex items-center gap-2'>
									<label className='text-xs font-medium text-gray-700'>
										คอลัมน์:
									</label>
									<input
										type='number'
										min='2'
										max='10'
										value={columns}
										onChange={(e) =>
											updateTableSize(rows, parseInt(e.target.value) || 2)
										}
										className='w-16 px-2 py-1 text-xs border border-grey rounded focus:outline-none focus:ring-1 focus:ring-blue-500'
									/>
								</div>
							</div>
						)}

						<div className='overflow-x-auto'>
							<table className='w-full border-collapse border border-gray-300'>
								{Array.from({ length: rows }).map((_, rowIndex) => (
									<tr key={rowIndex}>
										{Array.from({ length: columns }).map((_, colIndex) => {
											// Top-left cell (0,0) - empty and non-editable
											if (rowIndex === 0 && colIndex === 0) {
												return (
													<td
														key={colIndex}
														className='border border-gray-300 p-2 bg-gray-100'
													>
														<div className='w-full h-8'></div>
													</td>
												);
											}

											// First row (column headers)
											if (rowIndex === 0) {
												return (
													<td
														key={colIndex}
														className='border border-gray-300 p-2 bg-blue-50'
													>
														{onUpdateTableConfig ? (
															<input
																type='text'
																value={
																	columnLabels[colIndex - 1] || ''
																}
																onChange={(e) =>
																	updateColumnLabel(
																		colIndex - 1,
																		e.target.value
																	)
																}
																className='w-full border-none outline-none bg-transparent text-center font-medium'
																placeholder={`คอลัมน์ ${colIndex}`}
															/>
														) : (
															<div className='text-center font-medium'>
																{columnLabels[colIndex - 1] ||
																	`คอลัมน์ ${colIndex}`}
															</div>
														)}
													</td>
												);
											}

											// First column (row headers)
											if (colIndex === 0) {
												return (
													<td
														key={colIndex}
														className='border border-gray-300 p-2 bg-blue-50'
													>
														{onUpdateTableConfig ? (
															<input
																type='text'
																value={
																	rowLabels[rowIndex - 1] || ''
																}
																onChange={(e) =>
																	updateRowLabel(
																		rowIndex - 1,
																		e.target.value
																	)
																}
																className='w-full border-none outline-none bg-transparent text-center font-medium'
																placeholder={`แถว ${rowIndex}`}
															/>
														) : (
															<div className='text-center font-medium'>
																{rowLabels[rowIndex - 1] ||
																	`แถว ${rowIndex}`}
															</div>
														)}
													</td>
												);
											}

											// Data cells - non-editable
											return (
												<td
													key={colIndex}
													className='border border-gray-300 p-2'
												>
													<input
														type='text'
														className='w-full border-none outline-none bg-transparent text-center'
														placeholder='ข้อมูล'
														disabled
													/>
												</td>
											);
										})}
									</tr>
								))}
							</table>
						</div>
					</div>
				);

			case 'date':
				return (
					<input
						type='date'
						className='w-full px-3 py-2 border border-grey rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						disabled
					/>
				);

			case 'time':
				return (
					<input
						type='time'
						className='w-full px-3 py-2 border border-grey rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						disabled
					/>
				);

			case 'file_upload':
				return (
					<div className='space-y-3'>
						<div className='w-full px-3 py-2 border-2 border-dashed border-grey rounded-md text-center'>
							<div className='space-y-2'>
								<div className='text-gray-500 text-sm'>
									คลิกเพื่ออัปโหลดไฟล์{question.allow_multiple ? ' (หลายไฟล์)' : ''}
								</div>
								{question.file_types && question.file_types.length > 0 && (
									<div className='text-xs text-gray-400'>
										รองรับ: {question.file_types.join(', ')}
									</div>
								)}
							</div>
						</div>
						
						{/* File Upload Configuration */}
						<div className='bg-gray-50 p-3 rounded-md space-y-3'>
							<h4 className='text-sm font-medium text-gray-700'>การตั้งค่าไฟล์</h4>
							
							{/* Allow Multiple Files */}
							<div className='flex items-center space-x-2'>
								<input
									type='checkbox'
									id='allow_multiple'
									checked={question.allow_multiple || false}
									onChange={(e) => {
										if (onUpdateFileConfig) {
											onUpdateFileConfig({
												allow_multiple: e.target.checked,
												file_types: question.file_types,
											});
										}
									}}
									className='rounded'
								/>
								<label htmlFor='allow_multiple' className='text-sm text-gray-600'>
									อนุญาตให้อัปโหลดหลายไฟล์
								</label>
							</div>
							
							{/* File Types */}
							<div className='space-y-2'>
								<label className='text-sm text-gray-600'>ประเภทไฟล์ที่อนุญาต:</label>
								<div className='flex flex-wrap gap-2'>
									{['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'xls', 'xlsx'].map((type) => (
										<label key={type} className='flex items-center space-x-1 text-xs'>
											<input
												type='checkbox'
												checked={(question.file_types || []).includes(`.${type}`)}
												onChange={(e) => {
													if (onUpdateFileConfig) {
														const currentTypes = question.file_types || [];
														const fileType = `.${type}`;
														const newTypes = e.target.checked
															? [...currentTypes, fileType]
															: currentTypes.filter(t => t !== fileType);
														onUpdateFileConfig({
															allow_multiple: question.allow_multiple,
															file_types: newTypes,
														});
													}
												}}
												className='rounded'
											/>
											<span>{type.toUpperCase()}</span>
										</label>
									))}
								</div>
								{question.file_types && question.file_types.length === 0 && (
									<div className='text-xs text-gray-400'>ไม่ได้จำกัดประเภทไฟล์</div>
								)}
							</div>
						</div>
					</div>
				);

			default:
				return (
					<input
						type='text'
						placeholder='ข้อความ...'
						className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
						disabled
					/>
				);
		}
	};

	return <div className='mt-3'>{renderPreview()}</div>;
};
