import React, { useState, useEffect } from 'react';
import { fetchCsrfToken } from '../services/api';
import ImageUpload from './ImageUpload';
import ReceiptForm from './ReceiptForm';
import { ReceiptFormData } from '../types/Receipt';
import { Category } from '../types/Category';
import { getErrorMessage } from '../utils/errorHandler';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';

const ReceiptScanner: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptFormData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const queryClient = useQueryClient();

  // Load categories using TanStack React Query
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const response = await apiClient.get<Category[]>('/api/Categories');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Scan receipt mutation
  const scanReceiptMutation = useMutation({
    mutationFn: async (file: File): Promise<ReceiptFormData> => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post<ReceiptFormData>('/api/receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    },
    onSuccess: (data) => {
      setReceiptData(data);
      setError(null);
    },
    onError: (err) => {
      const errorMessage = getErrorMessage(err, 'Failed to scan receipt. Please try again.');
      setError(errorMessage);
      console.error('Failed to scan receipt:', err);
    }
  });

  // Save receipt mutation
  const saveReceiptMutation = useMutation({
    mutationFn: async (data: ReceiptFormData): Promise<void> => {
      const receiptPayload: ReceiptFormData = {
        ...data,
        imageUrl: data.imageUrl
      };

      await apiClient.post('/api/receipt/create', receiptPayload);
    },
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['receipts'] });

      // Reset form after successful save
      setTimeout(() => {
        setImageFile(null);
        setImagePreview(null);
        setReceiptData(null);
        setSuccess(false);
      }, 2000);
    },
    onError: (err) => {
      const errorMessage = getErrorMessage(err, 'Failed to save receipt. Please try again.');
      setError(errorMessage);
      console.error('Failed to save receipt:', err);
    }
  });

  // Fetch CSRF token on mount
  useEffect(() => {
    fetchCsrfToken();
  }, []);

  // Update error state if categories fail to load
  useEffect(() => {
    if (categoriesError && !error) {
      const errorMessage = getErrorMessage(categoriesError, 'Failed to load categories.');
      setError(errorMessage);
    }
  }, [categoriesError, error]);

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

    setError(null);
    setSuccess(false);
    
    scanReceiptMutation.mutate(imageFile);
  };

  const handleSaveReceipt = async (data: ReceiptFormData): Promise<void> => {
    setError(null);
    setSuccess(false);
    
    saveReceiptMutation.mutate(data);
  };

  const handleReset = (): void => {
    setImageFile(null);
    setImagePreview(null);
    setReceiptData(null);
    setError(null);
    setSuccess(false);
    
    // Reset mutation states
    scanReceiptMutation.reset();
    saveReceiptMutation.reset();
  };

  // Determine loading state
  const isLoading = scanReceiptMutation.isPending || saveReceiptMutation.isPending;

  // Show loading state if categories are still loading
  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-8 rounded-xl bg-white p-8
                border border-black/5
                shadow-[0_10px_40px_rgba(0,0,0,0.1)]
                dark:bg-slate-900 dark:border-white/10 dark:shadow-[0_10px_40px_rgba(0,0,0,0.35)]
                lg:grid-cols-2">
        {/* Left: image upload + scan button */}
        <div className="flex flex-col gap-4">
          <ImageUpload onImageSelect={handleImageSelect} imagePreview={imagePreview} disabled={isLoading} />

          {imageFile && !receiptData && (
            <button
              onClick={handleScanReceipt}
              disabled={isLoading}
              className="mt-4 rounded-md bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] px-6 py-3 text-base font-medium text-white
                         transition-transform duration-200 ease-in-out
                         hover:-translate-y-0.5 hover:shadow-lg
                         disabled:cursor-not-allowed disabled:opacity-60"
            >
              {scanReceiptMutation.isPending ? 'Scanning...' : 'Scan Receipt'}
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
              onSave={handleSaveReceipt}
              onReset={handleReset}
              loading={saveReceiptMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptScanner;
