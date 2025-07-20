'use client';
import { AuthWrapper } from '@/components/authWrapper';
import { HomeLayout } from '@/components/layouts/homeLayout';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { useParams, useRouter } from 'next/navigation';
import { FC, useState } from 'react';

const ScholarAnalyticsPage: FC = () => {
	const router = useRouter();
	const params = useParams();
	const scholarId = params.scholarId as string;
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [searchType, setSearchType] = useState<'name' | 'keyword'>('name');

	const handleSearch = (query: string, type: 'name' | 'keyword') => {
		setSearchQuery(query);
		setSearchType(type);
	};

	const handleBackToScholar = () => {
		router.push(`/scholar/${scholarId}`);
	};

	return (
		<AuthWrapper>
			<HomeLayout onSearch={handleSearch} searchQuery={searchQuery} searchType={searchType}>
				<div className="w-full h-full flex flex-col mx-auto mt-24 px-6">
					{/* Header */}
					<div className="flex items-center justify-between mb-8">
						<div className="flex items-center gap-4">
							<button
								onClick={handleBackToScholar}
								className="flex items-center gap-2 text-violet-3 hover:text-violet-4 transition-colors"
							>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
								</svg>
								<span>กลับ</span>
							</button>
							<h1 className="text-3xl font-bold text-gray-900">การวิเคราะห์ข้อมูล</h1>
						</div>
					</div>

					{/* Analytics Dashboard */}
					<div className="flex-1 overflow-y-auto">
						<AnalyticsDashboard scholarId={scholarId} searchQuery={searchQuery} searchType={searchType} />
					</div>
				</div>
			</HomeLayout>
		</AuthWrapper>
	);
};

export default ScholarAnalyticsPage;