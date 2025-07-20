export interface ChartDataset {
	label: string;
	data: number[];
	backgroundColor: string[];
	borderColor?: string[];
	borderWidth?: number;
}

export interface ChartData {
	labels: string[];
	datasets: ChartDataset[];
}

export interface QuestionAnalytics {
	questionId: string;
	questionLabel: string;
	questionType: string;
	totalResponses: number;
	chartType: 'doughnut' | 'bar' | 'line';
	chartData: ChartData;
	statistics?: {
		min?: number;
		max?: number;
		average?: number;
	};
}

export interface ScholarAnalytics {
	totalStudents: number;
	completedStudents: number;
	incompleteStudents: number;
	questions: QuestionAnalytics[];
}

export namespace AnalyticsResponse {
	export type get = {
		success: boolean;
		msg: string;
		data: ScholarAnalytics;
	};
}