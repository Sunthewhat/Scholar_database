export type QuestionType = 
  | 'short_answer' 
  | 'long_answer' 
  | 'radio' 
  | 'checkbox' 
  | 'dropdown' 
  | 'table' 
  | 'date' 
  | 'time' 
  | 'file_upload';

export type ValidationRule = {
  min_length?: number;
  max_length?: number;
  required_files?: number;
  max_file_size?: number;
  allowed_extensions?: string[];
  min_date?: Date;
  max_date?: Date;
};

export type TableConfig = {
  rows: number;
  columns: number;
  row_labels?: string[];
  column_labels?: string[];
};

export type Question = {
  question_id: string;
  question_type: QuestionType;
  question_label: string;
  required?: boolean;
  options?: string[];
  allow_other?: boolean;
  validation?: ValidationRule;
  placeholder?: string;
  help_text?: string;
  table_config?: TableConfig;
  file_types?: string[];
  allow_multiple?: boolean;
  order: number;
};

export type ScholarField = {
  _id?: string;
  scholar_id: string;
  field_name: string;
  field_label: string;
  field_description?: string;
  order: number;
  questions: Question[];
  created_at?: Date;
  updated_at?: Date;
};

export type CreateFieldPayload = Omit<ScholarField, '_id' | 'created_at' | 'updated_at'>;
export type UpdateFieldPayload = Partial<Omit<ScholarField, '_id' | 'scholar_id' | 'created_at' | 'updated_at'>>;