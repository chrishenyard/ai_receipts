import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ReceiptFormData } from '../types/Receipt';
import { Category } from '../types/Category';

interface ReceiptFormProps {
  data: ReceiptFormData;
  categories: Category[];
  onSave: (data: ReceiptFormData) => void;
  onReset: () => void;
  loading: boolean;
}

const ReceiptForm: React.FC<ReceiptFormProps> = ({
  data,
  categories,
  onSave,
  onReset,
  loading
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<ReceiptFormData>({
    defaultValues: {
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
    }
  });

  useEffect(() => {
    if (data) {
      const formattedData = {
        ...data,
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
      };
      reset(formattedData);
    }
  }, [data, reset]);

  const onSubmit = (formData: ReceiptFormData) => {
    onSave(formData);
  };

  const handleReset = () => {
    reset();
    onReset();
  };

  const labelClass = 'mb-2 text-[0.95rem] font-medium text-gray-600 dark:text-slate-300';
  const inputClass =
    'rounded-md border bg-white p-3 text-base text-gray-900 transition-colors ' +
    'focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 ' +
    'disabled:cursor-not-allowed disabled:bg-gray-50 ' +
    'dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-900';
  const inputErrorClass = 'border-red-500 focus:border-red-500 focus:ring-red-500/10';
  const textareaClass =
    'min-h-[100px] resize-y rounded-md border bg-white p-3 text-base text-gray-900 transition-colors ' +
    'focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 ' +
    'disabled:cursor-not-allowed disabled:bg-gray-50 ' +
    'dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:disabled:bg-slate-900';
  const errorMessageClass = 'mt-1 text-sm text-red-600 dark:text-red-400';

  const getInputClassName = (fieldName: keyof ReceiptFormData, isTextarea = false) => {
    const baseClass = isTextarea ? textareaClass : inputClass;
    const hasError = errors[fieldName];
    return `${baseClass} ${hasError ? inputErrorClass : 'border-gray-300'}`;
  };

  return (
    <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
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
            disabled={loading}
            className={getInputClassName('title')}
            {...register('title', {
              required: 'Title is required',
              minLength: {
                value: 2,
                message: 'Title must be at least 2 characters long'
              },
              maxLength: {
                value: 100,
                message: 'Title must be no more than 100 characters'
              }
            })}
          />
          {errors.title && (
            <span className={errorMessageClass}>{errors.title.message}</span>
          )}
        </div>

        {/* Description (full width) */}
        <div className="flex flex-col md:col-span-2">
          <label htmlFor="description" className={labelClass}>
            Description <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <textarea
            id="description"
            rows={3}
            disabled={loading}
            className={getInputClassName('description', true)}
            {...register('description', {
              required: 'Description is required',
              minLength: {
                value: 5,
                message: 'Description must be at least 5 characters long'
              },
              maxLength: {
                value: 4096,
                message: 'Description must be no more than 4096 characters'
              }
            })}
          />
          {errors.description && (
            <span className={errorMessageClass}>{errors.description.message}</span>
          )}
        </div>

        {/* Vendor */}
        <div className="flex flex-col">
          <label htmlFor="vendor" className={labelClass}>
            Vendor <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            type="text"
            id="vendor"
            disabled={loading}
            className={getInputClassName('vendor')}
            {...register('vendor', {
              required: 'Vendor is required',
              minLength: {
                value: 2,
                message: 'Vendor must be at least 2 characters long'
              },
              maxLength: {
                value: 100,
                message: 'Vendor must be no more than 100 characters'
              }
            })}
          />
          {errors.vendor && (
            <span className={errorMessageClass}>{errors.vendor.message}</span>
          )}
        </div>

        {/* Category */}
        <div className="flex flex-col">
          <label htmlFor="categoryId" className={labelClass}>
            Category <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <select
            id="categoryId"
            disabled={loading}
            className={getInputClassName('categoryId') + ' dark:scheme-dark'}
            {...register('categoryId', {
              required: 'Please select a category',
              validate: (value) => value > 0 || 'Please select a valid category'
            })}
          >
            <option value={0}>Select a category</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <span className={errorMessageClass}>{errors.categoryId.message}</span>
          )}
        </div>

        {/* City */}
        <div className="flex flex-col">
          <label htmlFor="city" className={labelClass}>
            City <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            type="text"
            id="city"
            disabled={loading}
            className={getInputClassName('city')}
            {...register('city', {
              required: 'City is required',
              minLength: {
                value: 2,
                message: 'City must be at least 2 characters long'
              },
              maxLength: {
                value: 100,
                message: 'City must be no more than 100 characters'
              }
            })}
          />
          {errors.city && (
            <span className={errorMessageClass}>{errors.city.message}</span>
          )}
        </div>

        {/* State */}
        <div className="flex flex-col">
          <label htmlFor="state" className={labelClass}>
            State <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            type="text"
            id="state"
            disabled={loading}
            className={getInputClassName('state')}
            {...register('state', {
              required: 'State is required',
              minLength: {
                value: 2,
                message: 'State must be at least 2 characters long'
              },
              maxLength: {
                value: 100,
                message: 'State must be no more than 100 characters'
              }
            })}
          />
          {errors.state && (
            <span className={errorMessageClass}>{errors.state.message}</span>
          )}
        </div>

        {/* Country */}
        <div className="flex flex-col">
          <label htmlFor="country" className={labelClass}>
            Country <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            type="text"
            id="country"
            disabled={loading}
            className={getInputClassName('country')}
            {...register('country', {
              required: 'Country is required',
              minLength: {
                value: 2,
                message: 'Country must be at least 2 characters long'
              },
              maxLength: {
                value: 100,
                message: 'Country must be no more than 100 characters'
              }
            })}
          />
          {errors.country && (
            <span className={errorMessageClass}>{errors.country.message}</span>
          )}
        </div>

        {/* Purchase Date */}
        <div className="flex flex-col">
          <label htmlFor="purchaseDate" className={labelClass}>
            Purchase Date <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            type="date"
            id="purchaseDate"
            disabled={loading}
            className={getInputClassName('purchaseDate')}
            {...register('purchaseDate', {
              required: 'Purchase date is required',
              validate: (value) => {
                if (!value) return 'Purchase date is required';
                const date = new Date(value);
                const today = new Date();
                today.setHours(23, 59, 59, 999); // End of today
                if (date > today) {
                  return 'Purchase date cannot be in the future';
                }
                const minDate = new Date('1900-01-01');
                if (date < minDate) {
                  return 'Purchase date cannot be before 1900';
                }
                return true;
              }
            })}
          />
          {errors.purchaseDate && (
            <span className={errorMessageClass}>{errors.purchaseDate.message}</span>
          )}
        </div>

        {/* Tax */}
        <div className="flex flex-col">
          <label htmlFor="tax" className={labelClass}>
            Tax
          </label>
          <input
            type="number"
            id="tax"
            step="0.01"
            disabled={loading}
            className={getInputClassName('tax')}
            {...register('tax', {
              min: {
                value: 0,
                message: 'Tax cannot be negative'
              },
              max: {
                value: 999999.99,
                message: 'Tax amount is too large'
              },
              validate: (value) => {
                if (value !== undefined && value !== null) {
                  const decimalPlaces = (value.toString().split('.')[1] || '').length;
                  if (decimalPlaces > 2) {
                    return 'Tax can have at most 2 decimal places';
                  }
                }
                return true;
              }
            })}
          />
          {errors.tax && (
            <span className={errorMessageClass}>{errors.tax.message}</span>
          )}
        </div>

        {/* Total */}
        <div className="flex flex-col">
          <label htmlFor="total" className={labelClass}>
            Total <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <input
            type="number"
            id="total"
            step="0.01"
            disabled={loading}
            className={getInputClassName('total')}
            {...register('total', {
              required: 'Total amount is required',
              min: {
                value: 0.01,
                message: 'Total must be greater than 0'
              },
              max: {
                value: 999999.99,
                message: 'Total amount is too large'
              },
              validate: (value) => {
                if (value !== undefined && value !== null) {
                  const decimalPlaces = (value.toString().split('.')[1] || '').length;
                  if (decimalPlaces > 2) {
                    return 'Total can have at most 2 decimal places';
                  }
                }
                return true;
              }
            })}
          />
          {errors.total && (
            <span className={errorMessageClass}>{errors.total.message}</span>
          )}
        </div>

        {/* Extracted Text (full width) */}
        <div className="flex flex-col md:col-span-2">
          <label htmlFor="extractedText" className={labelClass}>
            Extracted Text <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <textarea
            id="extractedText"
            rows={6}
            disabled={loading}
            className={getInputClassName('extractedText', true) + ' font-mono text-sm'}
            {...register('extractedText', {
              required: 'Extracted text is required',
              minLength: {
                value: 10,
                message: 'Extracted text must be at least 10 characters long'
              },
              maxLength: {
                value: 4096,
                message: 'Extracted text must be no more than 4096 characters'
              }
            })}
          />
          {errors.extractedText && (
            <span className={errorMessageClass}>{errors.extractedText.message}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-gray-200 pt-4 dark:border-slate-800 md:flex-row md:justify-end">
        <button
          type="button"
          onClick={handleReset}
          disabled={loading}
          className="rounded-md bg-gray-200 px-6 py-3 text-base font-medium text-gray-600 transition
            hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60
            dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Reset
        </button>

        <button
          type="submit"
          disabled={loading || !isValid}
          className="rounded-md bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-6 py-3 text-base font-medium text-white
                     transition-transform duration-200 ease-in-out
                     hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none"
        >
          {loading ? 'Saving...' : 'Save Receipt'}
        </button>
      </div>
    </form>
  );
};

export default ReceiptForm;
