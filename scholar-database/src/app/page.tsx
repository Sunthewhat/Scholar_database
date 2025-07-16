'use client';
import { AuthWrapper } from '@/components/authWrapper';
import { ScholarList } from '@/components/home/scholarList';
import { HomeLayout } from '@/components/layouts/homeLayout';
import Image from 'next/image';
import Link from 'next/link';
import { FC, useState } from 'react';

const HomePage: FC = () => {
	const [scholarCount, setScholarCount] = useState<number>(0);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [searchType, setSearchType] = useState<'name' | 'keyword'>('name');

	const handleSearch = (query: string, type: 'name' | 'keyword') => {
		setSearchQuery(query);
		setSearchType(type);
	};

	const handleResetSearch = () => {
		setSearchQuery('');
		setSearchType('name');
	};

	const isSearchingStudents = searchQuery && searchType === 'keyword';

	return (
		<AuthWrapper requiredRole='maintainer'>
			<HomeLayout onSearch={handleSearch} searchQuery={searchQuery} searchType={searchType}>
				<div className='relative flex flex-col mt-24 w-[90%] mx-auto h-full pt-10'>
					<h1 className='text-2xl font-semibold text-center'>
						{isSearchingStudents ? 'ค้นหานักเรียนทั้งหมด' : 'ทุนการศึกษา'}
					</h1>
					<div className='w-full flex justify-end'>
						<Link href={'/newscholar'}>
							<button className='bg-violet-3 flex gap-2 items-center text-white px-3 py-1 rounded-xl'>
								<Image
									src='/assets/add.svg'
									alt='add'
									width={10}
									height={10}
									className=''
									style={{ width: 'auto', height: 'auto' }}
								/>
								<p className='text-center mt-1'>สร้างทุนการศึกษา</p>
							</button>
						</Link>
					</div>
					<div className='flex flex-col max-h-[65dvh] overflow-scroll w-full mt-8 scrollbar-hide'>
						<div className='w-full bg-violet-2 h-16 min-h-16 grid grid-cols-3 rounded-2xl text-white text-xl text-center items-center relative'>
							<h1 className='col-span-2'>
								{isSearchingStudents ? 'ชื่อนักเรียน' : 'รายการทุน'}
							</h1>
							<h1 className='col-span-1'>
								{isSearchingStudents ? 'ทุนการศึกษา' : 'จำนวนนักเรียน'}
							</h1>
							<div className='absolute left-2/3 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-px h-3/4 bg-violet-3'></div>
						</div>
						<ScholarList 
							setCount={setScholarCount} 
							searchQuery={searchQuery}
							searchType={searchType}
							onResetSearch={handleResetSearch}
						/>
					</div>
					<h1 className='text-right mt-5'>จำนวนทุนทั้งหมด {scholarCount} ทุน</h1>
				</div>
			</HomeLayout>
		</AuthWrapper>
	);
};

export default HomePage;
