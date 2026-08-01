// Book-related types
export interface Book {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_color: string;
  created_at: string;
  updated_at: string;
}

export interface BookFormData {
  title: string;
  description: string;
  cover_color: string;
}

export interface BookWithPageCount extends Book {
  page_count: number;
  last_page: {
    id: string;
    page_number: number;
    updated_at: string;
  } | null;
}

export interface CreateBookInput {
  title: string;
  description?: string;
  cover_color?: string;
}

export interface UpdateBookInput {
  title?: string;
  description?: string;
  cover_color?: string;
}

export const BOOK_COVER_COLORS = [
  { value: '#3B82F6', label: 'Blue', preview: 'bg-blue-500' },
  { value: '#EF4444', label: 'Red', preview: 'bg-red-500' },
  { value: '#10B981', label: 'Green', preview: 'bg-green-500' },
  { value: '#F59E0B', label: 'Amber', preview: 'bg-amber-500' },
  { value: '#8B5CF6', label: 'Violet', preview: 'bg-violet-500' },
  { value: '#EC4899', label: 'Pink', preview: 'bg-pink-500' },
  { value: '#06B6D4', label: 'Cyan', preview: 'bg-cyan-500' },
  { value: '#84CC16', label: 'Lime', preview: 'bg-lime-500' },
];