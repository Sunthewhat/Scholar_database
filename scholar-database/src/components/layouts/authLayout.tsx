import { FC, ReactNode } from 'react';
import Image from 'next/image';

type AuthLayoutProps = {
	children: ReactNode;
};

const AuthLayout: FC<AuthLayoutProps> = ({ children }) => {
	return (
		<main className='h-screen w-screen grid grid-cols-9 bg-gradient-to-b from-violet-gd0 to-violet-gd100 overflow-hidden'>
			<div className='absolute -left-[65dvh] top-1/2 transform -translate-y-1/2 h-[110dvh] w-[105dvh] bg-violet-circle3 rounded-[50%]'></div>
			<div className='absolute -left-[65dvh] top-1/2 transform -translate-y-1/2 h-[120dvh] w-[115dvh] bg-violet-circle2 rounded-[50%]'></div>
			<div className='absolute -left-[65dvh] top-1/2 transform -translate-y-1/2 h-[130dvh] w-[125dvh] bg-violet-circle1 rounded-[50%]'></div>
			<Image
				src='/assets/logo.svg'
				alt='logo'
				className='absolute right-10 top-6 w-10 h-20'
				width={100}
				height={100}
			/>
			<div className='relative col-start-4 col-span-6 z-10 w-full h-full'>{children}</div>
		</main>
	);
};

export { AuthLayout };
