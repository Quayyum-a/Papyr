// Book-related types
export interface Book {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_color: string;
  cover_theme: string;
  created_at: string;
  updated_at: string;
}

export interface BookFormData {
  title: string;
  description: string;
  cover_color: string;
  cover_theme: string;
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
  cover_theme?: string;
}

export interface UpdateBookInput {
  title?: string;
  description?: string;
  cover_color?: string;
  cover_theme?: string;
}

export interface Theme {
  name: string;
  color: string;
  accent: string;
}

export const THEMES: Theme[] = [
  { name: 'Graphite', color: '#282a2c', accent: '#b8b8b5' },
  { name: 'Sand', color: '#d7c6a5', accent: '#5e5447' },
  { name: 'Forest', color: '#244534', accent: '#c2d3c5' },
  { name: 'Ocean', color: '#254a5b', accent: '#c0d8df' },
  { name: 'Slate', color: '#46515e', accent: '#d5d8dd' },
  { name: 'Terracotta', color: '#a94d34', accent: '#f1d1c4' },
  { name: 'Indigo', color: '#303553', accent: '#d5d7eb' },
  { name: 'Emerald', color: '#1d6146', accent: '#cae8d8' },
];