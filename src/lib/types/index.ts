export interface Student {
  id: string;
  student_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  student_type: StudentType;
  course: string | null;
  year_level: number | null;
  status: string;
  enrolled_at: string | null;
  created_at: string;
  updated_at: string;
}

export type StudentType = "regular" | "irregular" | "transferee" | "graduating" | "graduated";

export interface StudentFormData {
  student_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  student_type: StudentType;
  course?: string;
  year_level?: number;
  enrolled_at?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  unit: string | null;
  location: string | null;
  description: string | null;
  min_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryFormData {
  name: string;
  category?: string;
  quantity: number;
  unit?: string;
  location?: string;
  description?: string;
  min_threshold?: number;
}

export interface InventoryAttachment {
  id: string;
  item_id: string;
  file_path: string;
  file_name: string;
  file_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface ImportLog {
  id: string;
  filename: string;
  total_rows: number;
  successful: number;
  failed: number;
  errors: ImportError[];
  imported_by: string | null;
  created_at: string;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
  data: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}