import React, { useState, useEffect } from 'react';
import { ReceiptFormData } from '../types/Receipt';
import { Category } from '../types/Category';

interface ReceiptFormProps {
  data: ReceiptFormData;
  categories: Category[];
  onChange: (data: ReceiptFormData) => void;
  onSave: (data: ReceiptFormData) => void;
  onReset: () => void;
  loading: boolean;
}

const ReceiptForm: React.FC<ReceiptFormProps> = ({
  data,
  categories,
  onChange,
  onSave,
  onReset,
  loading
}) => {
  const [formData, setFormData] = useState<ReceiptFormData>({
    extractedText: '',
    title: '',
    description: '',
    vendor: '',
    state: '',
    city: '',
    country: '',
    imageUrl: '',
    tax: 0,
    total: 0,
    purchaseDate: '',
    categoryId: 0
  });

  useEffect(() => {
    if (data) {
      setFormData({
        receiptId: data.receiptId || 0,
        extractedText: data.extractedText || '',
        title: data.title || '',
        description: data.description || '',
        vendor: data.vendor || '',
        state: data.state || '',
        city: data.city || '',
        country: data.country || '',
        imageUrl: data.imageUrl || '',
        tax: data.tax || 0,
        total: data.total || 0,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString().split('T')[0] : '',
        categoryId: data.categoryId || 0
      });
    }
  }, [data]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;

    const updatedData: ReceiptFormData = {
      ...formData,
      [name]: newValue
    };

    setFormData(updatedData);
    onChange(updatedData);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    // Validate required fields
    if (!formData.title || !formData.vendor) {
      alert('Title and Vendor are required fields');
      return;
    }

    onSave(formData);
  };

  const labelClass = 'mb-2 text-[0.95rem] font-medium text-gray-600 dark:text-slate-300';
  const inputClass =
    'rounded-md border border-gray-300 bg-white p-3 text-base text-gray-900 transition-colors ' +
    'focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 ' +
    'disabled:cursor-not-allowed disabled:bg-gray-50 ' +
    'dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-900';
  const textareaClass =
    'min-h-[100px] resize-y rounded-md border border-gray-300 bg-white p-3 text-base text-gray-900 transition-colors ' +
    'focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 ' +
    'disabled:cursor-not-allowed disabled:bg-gray-50 ' +
    'dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-900';

  return (
    <form className="w-full" onSubmit={handleSubmit}>
      <h2 className="mb-6 text-2xl text-gray-800 dark:text-slate-100">Receipt Details</h2>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Title (full width) */}
        <div className="flex flex-col md:col-span-2">
          <label htmlFor="title" className={labelClass}>
            Title <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            maxLength={100}
            required
            disabled={loading}
            className={inputClass}
          />
        </div>

        {/* Description (full width) */}
        <div className="flex flex-col md:col-span-2">
          <label htmlFor="description" className={labelClass}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            maxLength={4096}
            rows={3}
            disabled={loading}
            className={textareaClass}
          />
        </div>

        {/* Vendor */}
        <div className="flex flex-col">
          <label htmlFor="vendor" className={labelClass}>
            Vendor <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            type="text"
            id="vendor"
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
            maxLength={100}
            required
            disabled={loading}
            className={inputClass}
          />
        </div>

        {/* Category */}
        <div className="flex flex-col">
          <label htmlFor="categoryId" className={labelClass}>
            Category
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            disabled={loading}
            className={inputClass + ' dark:scheme-dark'}
          >
            <option value={0}>Select a category</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div className="flex flex-col">
          <label htmlFor="city" className={labelClass}>
            City
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            maxLength={100}
            disabled={loading}
            className={inputClass}
          />
        </div>

        {/* State */}
        <div className="flex flex-col">
          <label htmlFor="state" className={labelClass}>
            State
          </label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            maxLength={100}
            disabled={loading}
            className={inputClass}
          />
        </div>

        {/* Country */}
        <div className="flex flex-col">
          <label htmlFor="country" className={labelClass}>
            Country
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            maxLength={100}
            disabled={loading}
            className={inputClass}
          />
        </div>

        {/* Purchase Date */}
        <div className="flex flex-col">
          <label htmlFor="purchaseDate" className={labelClass}>
            Purchase Date
          </label>
          <input
            type="date"
            id="purchaseDate"
            name="purchaseDate"
            value={formData.purchaseDate}
            onChange={handleChange}
            disabled={loading}
            className={inputClass}
          />
        </div>

        {/* Tax */}
        <div className="flex flex-col">
          <label htmlFor="tax" className={labelClass}>
            Tax
          </label>
          <input
            type="number"
            id="tax"
            name="tax"
            value={formData.tax}
            onChange={handleChange}
            step="0.01"
            min="0"
            disabled={loading}
            className={inputClass}
          />
        </div>

        {/* Total */}
        <div className="flex flex-col">
          <label htmlFor="total" className={labelClass}>
            Total
          </label>
          <input
            type="number"
            id="total"
            name="total"
            value={formData.total}
            onChange={handleChange}
            step="0.01"
            min="0"
            disabled={loading}
            className={inputClass}
          />
        </div>

        {/* Extracted Text (full width) */}
        <div className="flex flex-col md:col-span-2">
          <label htmlFor="extractedText" className={labelClass}>
            Extracted Text
          </label>
          <textarea
            id="extractedText"
            name="extractedText"
            value={formData.extractedText}
            onChange={handleChange}
            maxLength={4096}
            rows={6}
            disabled={loading}
            className={
              textareaClass + ' font-mono text-sm'
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-gray-200 pt-4 dark:border-slate-800 md:flex-row md:justify-end">
        <button
          type="button"
          onClick={onReset}
          disabled={loading}
          className="rounded-md bg-gray-200 px-6 py-3 text-base font-medium text-gray-600 transition
            hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60
            dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Reset
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-6 py-3 text-base font-medium text-white
                     transition-transform duration-200 ease-in-out
                     hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'Save Receipt'}
        </button>
      </div>
    </form>
  );
};

export default ReceiptForm;
