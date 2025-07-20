'use client';
import { FC, useEffect, useState, useCallback } from 'react';
import { ScholarAnalytics, QuestionAnalytics } from '@/types/analytics';
import { Axios } from '@/util/axios';

// Dynamic imports for Chart.js to avoid SSR issues
let Chart: any = null;
let Bar: any = null;
let Doughnut: any = null;
let Line: any = null;

const initializeCharts = async () => {
	if (typeof window !== 'undefined' && !Chart) {
		const [chartjs, { Bar: BarChart, Doughnut: DoughnutChart, Line: LineChart }] =
			await Promise.all([import('chart.js'), import('react-chartjs-2')]);

		const {
			Chart: ChartJS,
			CategoryScale,
			LinearScale,
			BarElement,
			Title,
			Tooltip,
			Legend,
			ArcElement,
			LineElement,
			PointElement,
		} = chartjs;

		// Register Chart.js components
		ChartJS.register(
			CategoryScale,
			LinearScale,
			BarElement,
			Title,
			Tooltip,
			Legend,
			ArcElement,
			LineElement,
			PointElement
		);

		Chart = ChartJS;
		Bar = BarChart;
		Doughnut = DoughnutChart;
		Line = LineChart;
	}
};

interface AnalyticsDashboardProps {
	scholarId: string;
	searchQuery?: string;
	searchType?: 'name' | 'keyword';
}

const AnalyticsDashboard: FC<AnalyticsDashboardProps> = ({ scholarId, searchQuery, searchType = 'name' }) => {
	const [analytics, setAnalytics] = useState<ScholarAnalytics | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [chartsReady, setChartsReady] = useState(false);

	const fetchAnalytics = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const response = await Axios.get(`/scholar/analytics/${scholarId}`);

			if (response.status === 200 && response.data.success) {
				setAnalytics(response.data.data);
			} else {
				setError(response.data.msg || 'เกิดข้อผิดพลาดในการดึงข้อมูลการวิเคราะห์');
			}
		} catch (err: any) {
			console.error('Error fetching analytics:', err);
			setError(err.response?.data?.msg || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
		} finally {
			setIsLoading(false);
		}
	}, [scholarId]);

	useEffect(() => {
		const loadChartsAndData = async () => {
			await initializeCharts();
			setChartsReady(true);
			await fetchAnalytics();
		};

		loadChartsAndData();
	}, [fetchAnalytics]);

	const renderChart = (question: QuestionAnalytics) => {
		if (!chartsReady || !Bar || !Doughnut || !Line) {
			return (
				<div className='flex items-center justify-center h-full'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-violet-3'></div>
				</div>
			);
		}
		const commonOptions = {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: 'bottom' as const,
					labels: {
						padding: 20,
						usePointStyle: true,
					},
				},
				title: {
					display: true,
					text: question.questionLabel,
					font: {
						size: 14,
						weight: 'bold' as const,
					},
					padding: 20,
				},
			},
		};

		const chartProps = {
			data: question.chartData,
			options: commonOptions,
		};

		switch (question.chartType) {
			case 'doughnut':
				return <Doughnut {...chartProps} />;
			case 'bar':
				return (
					<Bar
						{...chartProps}
						options={{
							...commonOptions,
							scales: {
								y: {
									beginAtZero: true,
									ticks: {
										stepSize: 1,
									},
								},
							},
						}}
					/>
				);
			case 'line':
				return (
					<Line
						{...chartProps}
						options={{
							...commonOptions,
							scales: {
								y: {
									beginAtZero: true,
									ticks: {
										stepSize: 1,
									},
								},
							},
						}}
					/>
				);
			default:
				return <div className='text-gray-500'>ไม่รองรับประเภทกราฟนี้</div>;
		}
	};

	if (isLoading) {
		return (
			<div className='bg-white rounded-lg shadow-md p-6'>
				<div className='flex items-center justify-center h-64'>
					<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-violet-3'></div>
					<span className='ml-3 text-lg text-gray-600'>
						กำลังโหลดข้อมูลการวิเคราะห์...
					</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='bg-white rounded-lg shadow-md p-6'>
				<div className='flex flex-col items-center justify-center h-64'>
					<div className='text-lg text-red-500 mb-4'>{error}</div>
					<button
						onClick={fetchAnalytics}
						className='px-4 py-2 bg-violet-3 text-white rounded-lg hover:bg-violet-4 transition-colors'
					>
						ลองใหม่
					</button>
				</div>
			</div>
		);
	}

	if (!analytics) {
		return (
			<div className='bg-white rounded-lg shadow-md p-6'>
				<div className='flex items-center justify-center h-64'>
					<div className='text-lg text-gray-500'>ไม่มีข้อมูลการวิเคราะห์</div>
				</div>
			</div>
		);
	}

	const completionRate =
		analytics.totalStudents > 0
			? Math.round((analytics.completedStudents / analytics.totalStudents) * 100)
			: 0;

	// Filter questions based on search query and type
	const filteredQuestions = analytics?.questions.filter(question => {
		if (!searchQuery || !searchQuery.trim()) return true;
		
		if (searchType === 'name') {
			// Search by question label/name
			return question.questionLabel.toLowerCase().includes(searchQuery.toLowerCase());
		} else {
			// Search by question type (keyword search)
			return question.questionType.toLowerCase().includes(searchQuery.toLowerCase());
		}
	}) || [];

	return (
		<div className='space-y-6'>
			{/* Summary Statistics */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
				<div className='bg-white rounded-lg shadow-md p-6'>
					<div className='flex items-center'>
						<div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
							<svg
								className='w-6 h-6 text-blue-600'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
								/>
							</svg>
						</div>
						<div className='ml-4'>
							<p className='text-sm font-medium text-gray-600'>นักเรียนทั้งหมด</p>
							<p className='text-2xl font-bold text-gray-900'>
								{analytics.totalStudents}
							</p>
						</div>
					</div>
				</div>

				<div className='bg-white rounded-lg shadow-md p-6'>
					<div className='flex items-center'>
						<div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
							<svg
								className='w-6 h-6 text-green-600'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
								/>
							</svg>
						</div>
						<div className='ml-4'>
							<p className='text-sm font-medium text-gray-600'>กรอกข้อมูลสมบูรณ์</p>
							<p className='text-2xl font-bold text-green-600'>
								{analytics.completedStudents}
							</p>
						</div>
					</div>
				</div>

				<div className='bg-white rounded-lg shadow-md p-6'>
					<div className='flex items-center'>
						<div className='w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center'>
							<svg
								className='w-6 h-6 text-yellow-600'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
								/>
							</svg>
						</div>
						<div className='ml-4'>
							<p className='text-sm font-medium text-gray-600'>
								กรอกข้อมูลไม่สมบูรณ์
							</p>
							<p className='text-2xl font-bold text-yellow-600'>
								{analytics.incompleteStudents}
							</p>
						</div>
					</div>
				</div>

				<div className='bg-white rounded-lg shadow-md p-6'>
					<div className='flex items-center'>
						<div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center'>
							<svg
								className='w-6 h-6 text-purple-600'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
								/>
							</svg>
						</div>
						<div className='ml-4'>
							<p className='text-sm font-medium text-gray-600'>อัตราความสำเร็จ</p>
							<p className='text-2xl font-bold text-purple-600'>{completionRate}%</p>
						</div>
					</div>
				</div>
			</div>

			{/* Charts Grid */}
			{filteredQuestions.length > 0 ? (
				<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
					{filteredQuestions.map((question) => (
						<div
							key={question.questionId}
							className='bg-white rounded-lg shadow-md p-6'
						>
							<div className='h-80'>{renderChart(question)}</div>
							<div className='mt-4 pt-4 border-t border-gray-200'>
								<div className='flex justify-between text-sm text-gray-600'>
									<span>ประเภท: {question.questionType}</span>
									<span>การตอบกลับ: {question.totalResponses}</span>
								</div>
								{question.statistics && (
									<div className='mt-2 text-sm text-gray-600'>
										<div className='flex justify-between'>
											{question.statistics.min !== undefined && (
												<span>ต่ำสุด: {question.statistics.min}</span>
											)}
											{question.statistics.max !== undefined && (
												<span>สูงสุด: {question.statistics.max}</span>
											)}
											{question.statistics.average !== undefined && (
												<span>
													เฉลี่ย: {question.statistics.average.toFixed(2)}
												</span>
											)}
										</div>
									</div>
								)}
							</div>
						</div>
					))}
					<div className='w-full col-span-2 h-80'></div>
				</div>
			) : analytics?.questions.length === 0 ? (
				<div className='bg-white rounded-lg shadow-md p-6'>
					<div className='text-center text-gray-500'>
						<svg
							className='mx-auto h-12 w-12 text-gray-400 mb-4'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
							/>
						</svg>
						<h3 className='text-lg font-medium text-gray-900 mb-2'>
							ไม่มีข้อมูลการวิเคราะห์
						</h3>
						<p className='text-gray-500'>ยังไม่มีนักเรียนกรอกข้อมูลในฟอร์มนี้</p>
					</div>
				</div>
			) : (
				<div className='bg-white rounded-lg shadow-md p-6'>
					<div className='text-center text-gray-500'>
						<svg
							className='mx-auto h-12 w-12 text-gray-400 mb-4'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
							/>
						</svg>
						<h3 className='text-lg font-medium text-gray-900 mb-2'>
							ไม่พบผลลัพธ์การค้นหา
						</h3>
						<p className='text-gray-500'>
							ไม่พบคำถามที่ตรงกับคำค้นหา &ldquo;{searchQuery}&rdquo;
						</p>
					</div>
				</div>
			)}
		</div>
	);
};

export default AnalyticsDashboard;
