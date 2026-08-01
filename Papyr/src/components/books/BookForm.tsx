'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BOOK_COVER_COLORS } from '@/types/book';
import type { CreateBookInput, UpdateBookInput } from '@/types/book';

interface BookFormProps {
  initialData?: UpdateBookInput;
  onSubmit: (data: CreateBookInput | UpdateBookInput) => Promise<void>;
  isLoading: boolean;
  title: string;
  submitText: string;
}

export function BookForm({ initialData, onSubmit, isLoading, title, submitText }: BookFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateBookInput>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    cover_color: initialData?.cover_color || '#3B82F6',
  });
  const [errors, setErrors] = useState<Partial<CreateBookInput>>({});

  const validate = () => {
    const newErrors: Partial<CreateBookInput> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof CreateBookInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    await onSubmit(formData);
    router.back();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter book title"
          maxLength={100}
          disabled={isLoading}
          autoFocus
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Optional description for your book"
          maxLength={500}
          disabled={isLoading}
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        <p className="mt-1 text-xs text-gray-500">{(formData.description || '').length}/500 characters</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cover Color
        </label>
        <div className="grid grid-cols-4 gap-3">
          {BOOK_COVER_COLORS.map(color => (
            <button
              key={color.value}
              type="button"
              onClick={() => handleChange('cover_color', color.value)}
              className={`relative aspect-square rounded-lg border-4 transition-all ${
                formData.cover_color === color.value
                  ? 'border-blue-600 scale-105 ring-2 ring-blue-600 ring-offset-2'
                  : 'border-transparent hover:border-gray-300'
              }`}
              style={{ backgroundColor: color.value }}
              aria-label={color.label}
              aria-pressed={formData.cover_color === color.value}
            >
              {formData.cover_color === color.value && (
                <svg className="absolute inset-0 m-auto w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            submitText
          )}
        </button>
      </div>
    </form>
  );
}