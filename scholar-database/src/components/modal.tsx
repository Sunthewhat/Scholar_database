'use client';
import { FC, ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
	size?: 'sm' | 'md' | 'lg' | 'xl';
};

const Modal: FC<ModalProps> = ({ isOpen, onClose, children, size = 'md' }) => {
	// Close modal on Escape key press
	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
			// Prevent body scroll when modal is open
			document.body.style.overflow = 'hidden';
		}

		return () => {
			document.removeEventListener('keydown', handleEscape);
			document.body.style.overflow = 'unset';
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const getSizeClasses = () => {
		switch (size) {
			case 'sm':
				return 'max-w-md';
			case 'md':
				return 'max-w-lg';
			case 'lg':
				return 'max-w-2xl';
			case 'xl':
				return 'max-w-4xl';
			default:
				return 'max-w-lg';
		}
	};

	const modalContent = (
		<div
			className='fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center'
			style={{ zIndex: 99999 }}
		>
			{/* Backdrop */}
			<div
				className='absolute inset-0 w-full h-full bg-black bg-opacity-50 transition-opacity'
				style={{ zIndex: 99998 }}
				onClick={onClose}
			/>

			{/* Modal Content */}
			<div
				className={`relative bg-white rounded-2xl shadow-xl ${getSizeClasses()} w-full mx-4 max-h-[90vh] overflow-hidden`}
				style={{ zIndex: 99999 }}
			>
				<div className='px-6 py-4 overflow-y-auto max-h-[calc(90vh-80px)] scrollbar-hide'>{children}</div>
			</div>
		</div>
	);

	// Use portal to render at document body level
	return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

export { Modal };
