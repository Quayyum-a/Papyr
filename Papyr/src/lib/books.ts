import { supabase } from '@/lib/supabase/client';
import type { Book, BookWithPageCount, CreateBookInput, UpdateBookInput } from '@/types/book';

export async function getBooks(): Promise<{ data: BookWithPageCount[] | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('books')
      .select(`
        *,
        pages (
          id,
          page_number,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // Transform to include page count and last page
    const booksWithPageCount: BookWithPageCount[] = (data || []).map(book => {
      const pages = book.pages || [];
      const lastPage = pages.length > 0
        ? pages.reduce((latest, page) =>
            new Date(page.updated_at) > new Date(latest.updated_at) ? page : latest
          , pages[0])
        : null;

      return {
        ...book,
        page_count: pages.length,
        last_page: lastPage ? {
          id: lastPage.id,
          page_number: lastPage.page_number,
          updated_at: lastPage.updated_at
        } : null,
        pages: undefined // Remove pages from final object
      };
    });

    return { data: booksWithPageCount, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Failed to fetch books') };
  }
}

export async function getBook(id: string): Promise<{ data: Book | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Failed to fetch book') };
  }
}

export async function createBook(input: CreateBookInput): Promise<{ data: Book | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('books')
      .insert({
        user_id: user.id,
        title: input.title,
        description: input.description || null,
        cover_color: input.cover_color || '#3B82F6',
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Failed to create book') };
  }
}

export async function updateBook(id: string, input: UpdateBookInput): Promise<{ data: Book | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('books')
      .update(input)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Failed to update book') };
  }
}

export async function deleteBook(id: string): Promise<{ error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Failed to delete book') };
  }
}