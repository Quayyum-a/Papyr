-- Supabase Database Schema for Papyr
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Policies for books
CREATE POLICY "Users can view their own books"
  ON books FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own books"
  ON books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books"
  ON books FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books"
  ON books FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for books
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Pages table
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  content JSONB DEFAULT '{"strokes": [], "tables": []}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, page_number)
);

-- Enable RLS
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Policies for pages
CREATE POLICY "Users can view pages in their books"
  ON pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM books WHERE books.id = pages.book_id AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create pages in their books"
  ON pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM books WHERE books.id = pages.book_id AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pages in their books"
  ON pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM books WHERE books.id = pages.book_id AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pages in their books"
  ON pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM books WHERE books.id = pages.book_id AND books.user_id = auth.uid()
    )
  );

-- Trigger for pages
CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tables table
CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  rows INTEGER NOT NULL,
  columns INTEGER NOT NULL,
  cells JSONB DEFAULT '[]',
  x REAL DEFAULT 0,
  y REAL DEFAULT 0,
  width REAL DEFAULT 300,
  height REAL DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Policies for tables
CREATE POLICY "Users can view tables in their pages"
  ON tables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pages
      JOIN books ON books.id = pages.book_id
      WHERE pages.id = tables.page_id AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tables in their pages"
  ON tables FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pages
      JOIN books ON books.id = pages.book_id
      WHERE pages.id = tables.page_id AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tables in their pages"
  ON tables FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pages
      JOIN books ON books.id = pages.book_id
      WHERE pages.id = tables.page_id AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tables in their pages"
  ON tables FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM pages
      JOIN books ON books.id = pages.book_id
      WHERE pages.id = tables.page_id AND books.user_id = auth.uid()
    )
  );

-- Trigger for tables
CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_book_id ON pages(book_id);
CREATE INDEX IF NOT EXISTS idx_pages_book_page ON pages(book_id, page_number);
CREATE INDEX IF NOT EXISTS idx_tables_page_id ON tables(page_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();