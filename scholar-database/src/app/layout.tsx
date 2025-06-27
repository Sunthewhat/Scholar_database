import type { Metadata } from 'next';
import { Noto_Serif_Thai } from 'next/font/google';
import './globals.css';

const noto = Noto_Serif_Thai({ subsets: ['thai'] });

export const metadata: Metadata = {
	title: 'Scholar Student Database Manager',
	description: '',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en' className='h-full'>
			<body className={noto.className + ' h-full'}>{children}</body>
		</html>
	);
}
