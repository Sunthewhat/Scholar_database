import { Axios } from '@/util/axios';

interface FormSubmissionOptions {
	endpoint: string;
	method?: 'POST' | 'PUT' | 'PATCH';
	formData: Record<string, any>;
	files?: Record<string, File[]>;
}

export const submitFormWithFiles = async ({
	endpoint,
	method = 'POST',
	formData,
	files = {},
}: FormSubmissionOptions) => {
	const hasFiles = Object.keys(files).length > 0;

	if (hasFiles) {
		const multipartData = new FormData();

		multipartData.append('form_data', JSON.stringify(formData));

		for (const [fieldPath, fileList] of Object.entries(files)) {
			fileList.forEach((file, index) => {
				const fieldName = fileList.length > 1 ? `${fieldPath}[${index}]` : fieldPath;
				multipartData.append(fieldName, file);
			});
		}

		return await Axios({
			method,
			url: endpoint,
			data: multipartData,
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
	} else {
		return await Axios({
			method,
			url: endpoint,
			data: { form_data: formData },
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}
};

const isFile = (value: any): value is File => {
	return value instanceof File;
};

const isFileArray = (value: any): value is File[] => {
	return Array.isArray(value) && value.every(isFile);
};

export const extractFilesFromFormData = (
	formData: Record<string, any>
): {
	cleanFormData: Record<string, any>;
	files: Record<string, File[]>;
} => {
	const cleanFormData: Record<string, any> = {};
	const files: Record<string, File[]> = {};

	for (const [fieldId, fieldData] of Object.entries(formData)) {
		if (
			typeof fieldData === 'object' &&
			fieldData !== null &&
			!isFile(fieldData) &&
			!isFileArray(fieldData)
		) {
			cleanFormData[fieldId] = {};

			for (const [questionId, value] of Object.entries(fieldData)) {
				if (isFile(value)) {
					const fieldPath = `${fieldId}.${questionId}`;
					files[fieldPath] = [value];
				} else if (isFileArray(value)) {
					const fieldPath = `${fieldId}.${questionId}`;
					files[fieldPath] = value;
				} else {
					cleanFormData[fieldId][questionId] = value;
				}
			}
		} else {
			cleanFormData[fieldId] = fieldData;
		}
	}

	return { cleanFormData, files };
};
