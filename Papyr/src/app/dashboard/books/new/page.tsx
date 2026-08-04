'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase/client';

// We'll define the themes and categories here for now
const themes = [
  { name: 'Graphite', color: '#282a2c', accent: '#b8b8b5' },
  { name: 'Sand', color: '#d7c6a5', accent: '#5e5447' },
  { name: 'Forest', color: '#244534', accent: '#c2d3c5' },
  { name: 'Ocean', color: '#254a5b', accent: '#c0d8df' },
  { name: 'Slate', color: '#46515e', accent: '#d5d8dd' },
  { name: 'Terracotta', color: '#a94d34', accent: '#f1d1c4' },
  { name: 'Indigo', color: '#303553', accent: '#d5d7eb' },
  { name: 'Emerald', color: '#1d6146', accent: '#cae8d8' },
];

const categories = [
  { name: 'Phone Repair', description: 'Screen replacements, software flashing and device servicing.', icon: 'Smartphone' },
  { name: 'Laptop Repair', description: 'Diagnostics, repairs and spare parts tracking.', icon: 'Wrench' },
  { name: 'Car Mechanic', description: 'Vehicle repairs, parts and customer jobs.', icon: 'Settings2' },
  { name: 'Motorcycle Mechanic', description: 'Bike servicing, repairs and spare parts.', icon: 'Settings2' },
  { name: 'Electronics Store', description: 'Sales, stock and customer orders.', icon: 'Store' },
  { name: 'Phone Accessories', description: 'Accessories, repairs and inventory tracking.', icon: 'Package' },
  { name: 'POS Agent', description: 'Cash withdrawals, transfers and bill payments.', icon: 'WalletCards' },
  { name: 'Provision Shop', description: 'Daily consumer goods and inventory tracking.', icon: 'UtensilsCrossed' },
  { name: 'Supermarket', description: 'Groceries, household items and sales tracking.', icon: 'ShoppingCart' },
  { name: 'Boutique', description: 'Clothing, fashion items and sales records.', icon: 'ShoppingBag' },
  { name: 'Tailor', description: 'Measurements, alterations and customer orders.', icon: 'Scissors' },
  { name: 'Barbing Salon', description: 'Haircuts, shaves and grooming services.', icon: 'Scissors' },
  { name: 'Beauty Salon', description: 'Hair, nails, skin and beauty treatments.', icon: 'Sparkles' },
  { name: 'Restaurant', description: 'Food orders, ingredients and sales.', icon: 'UtensilsCrossed' },
  { name: 'Food Vendor', description: 'Street food, snacks and beverage sales.', icon: 'Utensils' },
  { name: 'Bakery', description: 'Bread, pastries and ingredient tracking.', icon: 'Wheat' },
  { name: 'Pharmacy', description: 'Medications, inventory and prescriptions.', icon: 'BriefcaseMedical' },
  { name: 'Hospital', description: 'Patient records, supplies and staff scheduling.', icon: 'BriefcaseMedical' },
  { name: 'School', description: 'Student records, supplies and attendance.', icon: 'BookOpen' },
  { name: 'Church', description: 'Events, donations and community activities.', icon: 'Church' },
  { name: 'Mosque', description: 'Prayer times, donations and community events.', icon: 'Moon' },
  { name: 'Warehouse', description: 'Inventory, shipments and storage management.', icon: 'Package' },
  { name: 'Construction', description: 'Projects, materials and labor tracking.', icon: 'HardHat' },
  { name: 'Printing Shop', description: 'Print jobs, ink and paper inventory.', icon: 'Printer' },
  { name: 'Cyber Cafe', description: 'Computer usage, printing and snack sales.', icon: 'Monitor' },
  { name: 'Fashion Designer', description: 'Designs, materials and client orders.', icon: 'Crop' },
  { name: 'Furniture', description: 'Sales, inventory and delivery tracking.', icon: 'Bed' },
  { name: 'Plumbing', description: 'Pipe repairs, installations and maintenance.', icon: 'Wrench' },
  { name: 'Electrical', description: 'Wiring, repairs and electrical services.', icon: 'Zap' },
  { name: 'Generator Repairs', description: 'Maintenance, fuel and service records.', icon: 'Zap' },
  { name: 'Other', description: 'Any other business not listed above.', icon: 'MoreHorizontal' },
];

// We'll import the icons from lucide-react
import {
  Smartphone,
  Wrench,
  Settings2,
  Store,
  Package,
  WalletCards,
  UtensilsCrossed,
  ShoppingCart,
  ShoppingBag,
  Scissors,
  Sparkles,
  Utensils,
  Wheat,
  BriefcaseMedical,
  
  Hospital,
  BookOpen,
  Church,
  Moon,
  HardHat,
  Printer,
  Monitor,
  Crop,
  Bed,
  Zap,
  MoreHorizontal,
} from 'lucide-react';

// Map icon names to actual components
const iconMap: Record<string, typeof Smartphone> = {
  Smartphone,
  Wrench,
  Settings2,
  Store,
  Package,
  WalletCards,
  UtensilsCrossed,
  ShoppingCart,
  ShoppingBag,
  Scissors,
  Sparkles,
  Utensils,
  Wheat,
  
  Hospital,
  BookOpen,
  Church,
  Moon,
  HardHat,
  Printer,
  Monitor,
  Crop,
  Bed,
  Zap,
  MoreHorizontal,
};

export default function NewBookPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState<string>('Graphite'); // default theme
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // We'll handle the redirect if not authenticated in a useEffect, but for now we'll keep it simple
  // We'll assume the user is authenticated for the purpose of the test.

  const isFormValid = title.trim().length >= 3 && title.trim().length <= 80 && description.trim().length <= 300;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Book name is required');
      return;
    }

    // Validate title length
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3 || trimmedTitle.length > 80) {
      setError('Book name must be between 3 and 80 characters');
      return;
    }

    // Validate description length
    if (description.trim().length > 300) {
      setError('Description must not exceed 300 characters');
      return;
    }

    setIsLoading(true);

    try {
      // We'll use the existing createBook function from lib/books if available, or use supabase directly
      // For now, we'll use supabase directly to match the existing pattern
      const selectedTheme = themes.find((t) => t.name === theme);
      const accentColor = selectedTheme?.accent || '#000000';

      const { data, error: insertError } = await supabase
        .from('books')
        .insert({
          title: trimmedTitle,
          description: description.trim(),
          cover_color: accentColor,
          // We are adding a new column for theme, but we don't have it in the schema yet.
          // We will leave it out for now and only use the cover_color.
          // We will need to add a migration for the theme column later.
          user_id: user?.id,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log('New book created:', data);
      router.push('/dashboard/books');
    } catch (err) {
      console.error('Failed to create book:', err);
      setError('Failed to create book. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard/books"
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold text-gray-900 ml-4">Papyr</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.display_name || user?.email}</span>
              <a
                href="/profile"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                Profile
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create New Book</h1>
          <p className="mt-1 text-gray-600">
            Create your first handwritten digital ledger.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left side: Form */}
          <div className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm" role="alert">
                {error}
              </div>
            )}

            {/* Book Name */}
            <div>
              <label htmlFor="book-name" className="block text-sm font-medium text-gray-700 mb-2">
                Book Name <span className="text-red-500">*</span>
              </label>
              <input
                id="book-name"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter the name written on your notebook"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
                disabled={isLoading}
                maxLength={80}
              />
              <p className="mt-1 text-xs text-gray-500">
                Examples: Repair Log, Sales Ledger, Daily Expenses, Customer Records
              </p>
            </div>

            {/* Business Category */}
            <div>
              <label htmlFor="business-category" className="block text-sm font-medium text-gray-700 mb-2">
                Business Category (Optional)
              </label>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((cat) => {
                  const IconComponent = iconMap[cat.icon] || ShoppingBag;
                  const isSelected = category === cat.name;
                  return (
                    <label
                      key={cat.name}
                      className={`relative group flex flex-col items-center rounded-lg border p-4 cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={cat.name}
                        checked={isSelected}
                        onChange={(e) => setCategory(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex h-10 w-10 items-center justify-center mb-2">
                        <IconComponent className={`
                          h-5 w-5 text-gray-600 group-hover:text-gray-800
                          ${isSelected ? 'text-indigo-600' : ''}
                        `} />
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-700">
                        {cat.name}
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 text-center">
                        {cat.description}
                      </p>
                    </label>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Select the category that best describes your business.
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe what this ledger will be used for"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={isLoading}
                maxLength={300}
              />
            </div>

            {/* Theme Selector */}
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
                Cover Design
              </label>
              <div className="grid gap-4 sm:grid-cols-4">
                {themes.map((th) => {
                  const isSelected = theme === th.name;
                  return (
                    <label
                      key={th.name}
                      className={`relative flex flex-col items-center rounded-lg border p-4 cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={th.name}
                        checked={isSelected}
                        onChange={(e) => setTheme(e.target.value)}
                        className="sr-only"
                      />
                      <div className="relative h-16 w-24 mb-2">
                        {/* We'll create a simple representation of the theme for now */}
                        <div className="absolute inset-0 rounded-lg bg-gray-200 overflow-hidden">
                          <div className="absolute inset-0 bg-[{th.color}]/20" />
                          <div className="absolute inset-0 bg-[{th.accent}]/10" />
                          <div className="absolute inset-0 bg-white/10" />
                        </div>
                        <div className="absolute inset-0 rounded-lg border-2 border-dashed border-gray-400" />
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-700">{th.name}</h3>
                      <p className="mt-1 text-xs text-gray-500 text-center">
                        {/* We can add a short description for each theme if needed */}
                        {/* For now, we'll leave it blank or use a generic description */}
                      </p>
                    </label>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Choose the cover design for your ledger.
              </p>
            </div>
          </div>

          {/* Right side: Live Preview */}
          <div className="hidden lg:flex lg:w-1/2 lg:ml-12">
            <div className="relative h-96 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden" data-testid="book-preview">
              {/* This is where the live preview of the book cover will be */}
              <div className="absolute inset-0">
                {/* We'll create a simple representation of the book cover based on the selected theme */}
                <div className="absolute inset-0 bg-[{theme === 'Graphite' ? '#282a2c' : theme === 'Sand' ? '#d7c6a5' : theme === 'Forest' ? '#244534' : theme === 'Ocean' ? '#254a5b' : theme === 'Slate' ? '#46515e' : theme === 'Terracotta' ? '#a94d34' : theme === 'Indigo' ? '#303553' : theme === 'Emerald' ? '#1d6146' : '#ffffff'}]/10">
                  {/* We would overlay a texture and pattern here */}
                  <div className="absolute inset-0 bg-[url('/textures/paper.png')] /10" />
                  <div className="absolute inset-0 bg-[url('/patterns/geometric.png')] /5" />
                  {/* We'll add the book name and category preview here */}
                  <div className="absolute bottom-4 left-4 right-4 text-center text-white font-bold text-shadow">
                    {title.length > 0 ? title : 'Book Name'}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 text-center text-xs text-white text-shadow">
                    {category ? category : 'Category'}
                  </div>
                </div>
                {/* We'll add a border to represent the book cover */}
                <div className="absolute inset-0 border-2 border-gray-300" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <Link
            href="/dashboard/books"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              !isFormValid
                ? 'bg-gray-300 text-gray-500 hover:bg-gray-300'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isLoading ? 'Creating...' : 'Create Book'}
          </button>
        </div>
      </main>
    </div>
  );
}
