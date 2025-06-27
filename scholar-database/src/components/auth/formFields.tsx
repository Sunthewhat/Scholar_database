import { ChangeEvent, FC, useState } from 'react';
import Image from 'next/image';

type AuthFormFieldsType = {
	label: string;
	value: string;
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
	error?: string | null;
	type?: 'text' | 'password';
	showPasswordToggle?: boolean;
};

const AuthFormFields: FC<AuthFormFieldsType> = ({ 
	label, 
	value, 
	onChange, 
	error, 
	type = 'text',
	showPasswordToggle = false 
}) => {
	const [showPassword, setShowPassword] = useState(false);

	const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

	const togglePasswordVisibility = () => {
		setShowPassword(!showPassword);
	};

	return (
		<div className='flex flex-col w-1/2 mt-0'>
			<label className='font-semibold'>{label}</label>
			<div className='relative'>
				<input
					type={inputType}
					className={`w-full h-10 rounded-xl mt-2 px-4 ${
						showPasswordToggle ? 'pr-12' : ''
					} ${error ? 'border-2 border-red-500' : ''}`}
					value={value}
					onChange={onChange}
				/>
				{showPasswordToggle && type === 'password' && (
					<button
						type="button"
						onClick={togglePasswordVisibility}
						className='absolute right-3 top-1/2 transform -translate-y-1/2 mt-1'
					>
						<Image
							src={showPassword ? '/assets/hidePass.svg' : '/assets/showPass.svg'}
							alt={showPassword ? 'Hide password' : 'Show password'}
							width={20}
							height={20}
							className='w-5 h-5'
						/>
					</button>
				)}
			</div>
			<div className='h-5 mt-1'>
				{error && <span className='text-red text-sm'>{error}</span>}
			</div>
		</div>
	);
};

export { AuthFormFields };
