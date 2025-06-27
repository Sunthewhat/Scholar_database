import { Axios } from '@/util/axios';
import { useState, useEffect, useCallback } from 'react';

export const useApiData = <T>(endpoint: string) => {
	const [data, setData] = useState<T | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isError, setIsError] = useState(false);

	const fetchData = useCallback(async () => {
		try {
			setIsLoading(true);
			setIsError(false);
			
			const response = await Axios.get(endpoint);

			if (response.status === 200 && response.data.success) {
				setData(response.data.data);
			} else {
				setIsError(true);
			}
		} catch (error) {
			console.error(`Error fetching data from ${endpoint}:`, error);
			setIsError(true);
		} finally {
			setIsLoading(false);
		}
	}, [endpoint]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return {
		data,
		isLoading,
		isError,
		refetch: fetchData,
		setData
	};
};