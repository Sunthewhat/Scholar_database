declare module 'bun' {
	interface Env {
		MONGO: string;
		ORIGIN: string;
		DEVELOPMENT: string;
		JWT_SECRET: string;
		STORAGE_URL: string;
		PUBLIC_STORAGE_URL: string;
		ADMIN_PASSWORD: string;
	}
}
