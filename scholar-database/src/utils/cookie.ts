/**
 * Get a cookie value by name
 * @param name - The name of the cookie
 * @returns The cookie value or empty string if not found
 */
export const getCookieValue = (name: string): string => {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
	return '';
};

/**
 * Set a cookie with specified options
 * @param name - The name of the cookie
 * @param value - The value of the cookie
 * @param options - Additional cookie options
 */
export const setCookie = (
	name: string, 
	value: string, 
	options: {
		path?: string;
		secure?: boolean;
		sameSite?: 'strict' | 'lax' | 'none';
		expires?: Date;
		maxAge?: number;
	} = {}
) => {
	let cookieString = `${name}=${value}`;
	
	if (options.path) cookieString += `; path=${options.path}`;
	if (options.secure) cookieString += '; secure';
	if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;
	if (options.expires) cookieString += `; expires=${options.expires.toUTCString()}`;
	if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
	
	document.cookie = cookieString;
};

/**
 * Remove a cookie by setting it to expire in the past
 * @param name - The name of the cookie to remove
 * @param path - The path of the cookie (should match the original path)
 */
export const removeCookie = (name: string, path: string = '/') => {
	document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
};

/**
 * Clear all authentication cookies
 */
export const clearAuthCookies = () => {
	removeCookie('authToken');
	removeCookie('userRole');
	removeCookie('userName');
};