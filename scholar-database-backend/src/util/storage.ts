const STORAGE_URL = Bun.env.STORAGE_URL || '';

const PUBLIC_STORAGE_URL = Bun.env.PUBLIC_STORAGE_URL || '';

interface FileUploadResponse {
	success: boolean;
	msg: string;
	data?: {
		url: string;
		filename: string;
		originalName: string;
		size: number;
		type: string;
	};
}

export const isFile = (value: FormDataEntryValue): value is File => {
	return value instanceof File;
};

export const StorageUtil = {
	uploadFile: async (file: File): Promise<FileUploadResponse> => {
		try {
			if (!STORAGE_URL) {
				throw new Error('STORAGE_URL not configured');
			}

			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch(`${STORAGE_URL}/storage/upload`, {
				method: 'POST',
				body: formData,
			});

			const result = await response.json();
			return result;
		} catch (error) {
			return {
				success: false,
				msg: error instanceof Error ? error.message : 'Failed to upload file',
			};
		}
	},

	deleteFile: async (filename: string): Promise<{ success: boolean; msg: string }> => {
		try {
			if (!STORAGE_URL) {
				throw new Error('STORAGE_URL not configured');
			}

			const response = await fetch(`${STORAGE_URL}/storage/file/${filename}`, {
				method: 'DELETE',
			});

			const result = await response.json();
			return result;
		} catch (error) {
			return {
				success: false,
				msg: error instanceof Error ? error.message : 'Failed to delete file',
			};
		}
	},

	getFileUrl: (filename: string): string => {
		if (!PUBLIC_STORAGE_URL) {
			return '';
		}
		return `${PUBLIC_STORAGE_URL}/storage/file/${filename}`;
	},

	extractFilenameFromUrl: (url: string): string | null => {
		const match = url.match(/\/storage\/file\/(.+)$/);
		return match ? match[1] : null;
	},

	processFormDataFiles: async (formData: FormData): Promise<Record<string, any>> => {
		const processedData: Record<string, any> = {};
		const fileUploads: Promise<void>[] = [];

		for (const [key, value] of formData.entries()) {
			// Skip the form_data field as it should be handled separately
			if (key === 'form_data') {
				continue;
			}

			if (isFile(value)) {
				fileUploads.push(
					(async () => {
						const uploadResult = await StorageUtil.uploadFile(value);
						if (uploadResult.success && uploadResult.data) {
							StorageUtil.setNestedValue(processedData, key, uploadResult.data.url);
						} else {
							throw new Error(`Failed to upload file ${key}: ${uploadResult.msg}`);
						}
					})()
				);
			} else {
				StorageUtil.setNestedValue(processedData, key, value);
			}
		}

		await Promise.all(fileUploads);
		return processedData;
	},

	setNestedValue: (obj: Record<string, any>, key: string, value: any) => {
		const keys = key.split('.');
		let current = obj;

		for (let i = 0; i < keys.length - 1; i++) {
			const k = keys[i];
			if (!(k in current) || typeof current[k] !== 'object' || current[k] === null) {
				current[k] = {};
			}
			current = current[k];
		}

		current[keys[keys.length - 1]] = value;
	},

	parseFormDataToObject: (formData: FormData): Record<string, any> => {
		const result: Record<string, any> = {};

		for (const [key, value] of formData.entries()) {
			if (typeof value === 'string') {
				try {
					const parsed = JSON.parse(value);
					StorageUtil.setNestedValue(result, key, parsed);
				} catch {
					StorageUtil.setNestedValue(result, key, value);
				}
			}
		}

		return result;
	},

	cleanupOldFiles: async (
		oldFormData: Record<string, any>,
		newFormData: Record<string, any>
	): Promise<void> => {
		const oldUrls = StorageUtil.extractFileUrls(oldFormData);
		const newUrls = StorageUtil.extractFileUrls(newFormData);

		const urlsToDelete = oldUrls.filter((url) => !newUrls.includes(url));

		for (const url of urlsToDelete) {
			const filename = StorageUtil.extractFilenameFromUrl(url);
			if (filename) {
				await StorageUtil.deleteFile(filename);
			}
		}
	},

	extractFileUrls: (formData: Record<string, any>): string[] => {
		const urls: string[] = [];

		for (const [_, sectionValue] of Object.entries(formData)) {
			if (typeof sectionValue === 'object' && sectionValue !== null) {
				for (const [_, fieldValue] of Object.entries(sectionValue)) {
					if (typeof fieldValue === 'string' && fieldValue.includes('/storage/file/')) {
						urls.push(fieldValue);
					}
				}
			}
		}

		return urls;
	},
};
