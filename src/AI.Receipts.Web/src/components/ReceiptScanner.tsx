import React, { useState, useEffect } from 'react';
import apiClient, { fetchCsrfToken } from '../services/api';
import ImageUpload from './ImageUpload';
import ReceiptForm from './ReceiptForm';
import { ReceiptFormData } from '../types/Receipt';
import { Category } from '../types/Category';
import { getErrorMessage } from '../utils/errorHandler';

const ReceiptScanner: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptFormData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Load categories and CSRF token on mount
  useEffect(() => {
    const initialize = async () => {
      await fetchCsrfToken(); // Fetch CSRF token first
      await loadCategories();
    };
    initialize();
  }, []);

  const loadCategories = async (): Promise<void> => {
    try {
      const response = await apiClient.get<Category[]>('/api/Categories');
      setCategories(response.data);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to load categories.');
      setError(errorMessage);
      console.error('Failed to load categories:', err);
    }
  };

  const handleImageSelect = (file: File): void => {
    setImageFile(file);
    setReceiptData(null);
    setError(null);
    setSuccess(false);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleScanReceipt = async (): Promise<void> => {
    if (!imageFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await apiClient.post<ReceiptFormData>('/api/receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setReceiptData(response.data);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to scan receipt. Please try again.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (updatedData: ReceiptFormData): void => {
    setReceiptData(updatedData);
  };

  const handleSaveReceipt = async (data: ReceiptFormData): Promise<void> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const receiptPayload: ReceiptFormData = {
        ...data,
        imageUrl: data.imageUrl || imageFile?.name || ''
      };

      await apiClient.post('/api/receipt/create', receiptPayload);

      setSuccess(true);

      // Reset form after successful save
      setTimeout(() => {
        setImageFile(null);
        setImagePreview(null);
        setReceiptData(null);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to save receipt. Please try again.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = (): void => {
    setImageFile(null);
    setImagePreview(null);
    setReceiptData(null);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-8 rounded-xl bg-white p-8
                border border-black/5
                shadow-[0_10px_40px_rgba(0,0,0,0.1)]
                dark:bg-slate-900 dark:border-white/10 dark:shadow-[0_10px_40px_rgba(0,0,0,0.35)]
                lg:grid-cols-2">
        {/* Left: image upload + scan button */}
        <div className="flex flex-col gap-4">
          <ImageUpload onImageSelect={handleImageSelect} imagePreview={imagePreview} disabled={loading} />

          {imageFile && !receiptData && (
            <button
              onClick={handleScanReceipt}
              disabled={loading}
              className="mt-4 rounded-md bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-6 py-3 text-base font-medium text-white
                         transition-transform duration-200 ease-in-out
                         hover:-translate-y-0.5 hover:shadow-lg
                         disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Scanning...' : 'Scan Receipt'}
            </button>
          )}
        </div>

        {/* Right: alerts + form */}
        <div className="flex flex-col">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-100 p-4 text-[0.95rem] text-red-800
                            dark:border-red-900/50 dark:bg-red-950/60 dark:text-red-200" role="alert">
              <strong className="mr-2 font-semibold">Error:</strong> {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-100 p-4 text-[0.95rem] text-green-800
                            dark:border-green-900/50 dark:bg-green-950/60 dark:text-green-200" role="alert">
              <strong className="mr-2 font-semibold">Success!</strong> Receipt saved successfully.
            </div>
          )}

          {receiptData && (
            <ReceiptForm
              data={receiptData}
              categories={categories}
              onChange={handleFormChange}
              onSave={handleSaveReceipt}
              onReset={handleReset}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptScanner;
