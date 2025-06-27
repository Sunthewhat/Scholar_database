import axios, { AxiosInstance } from 'axios';
import { getCookieValue } from '@/utils/cookie';

const Axios: AxiosInstance = axios.create({
	baseURL: process.env.NEXT_PUBLIC_API_URL,
	validateStatus: (s) => s >= 200 && s <= 500,
	headers: {
		'Content-Type': 'application/json; charset=utf-8',
	},
});

// Request interceptor to add Authorization header automatically
Axios.interceptors.request.use(
	(config) => {
		// Skip adding auth header for login endpoint
		if (config.url?.includes('/auth/login')) {
			return config;
		}

		// Add Authorization header for all other requests
		const token = getCookieValue('authToken');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

export { Axios };
