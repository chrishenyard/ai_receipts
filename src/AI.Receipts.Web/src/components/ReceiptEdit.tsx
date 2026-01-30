import React, { useState, useEffect } from 'react';
import { Receipt, ReceiptFormData } from '../types/Receipt';
import { Category } from '../types/Category';
import ReceiptForm from './ReceiptForm';
import apiClient from '../services/api';
import { getErrorMessage } from '../utils/errorHandler';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

interface ReceiptEditProps {
  receipt: Receipt;
  onCancel: () => void;
  onSave: (receipt: Receipt) => void;
}

const ReceiptEdit: React.FC<ReceiptEditProps> = ({
  receipt,
  onCancel,
  onSave
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [formData, setFormData] = useState<ReceiptFormData | null>(null);

  useEffect(() => {
    loadCategories();
    // Convert Receipt to ReceiptFormData
    setFormData({
      receiptId: receipt.receiptId,
      extractedText: receipt.extractedText,
      title: receipt.title,
      description: receipt.description,
      vendor: receipt.vendor,
      state: receipt.state,
      city: receipt.city,
      country: receipt.country,
      imageUrl: receipt.imageUrl,
      tax: receipt.tax,
      total: receipt.total,
      purchaseDate: receipt.purchaseDate,
      categoryId: receipt.categoryId
    });
  }, [receipt]);

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

  const handleSaveReceipt = async (data: ReceiptFormData): Promise<void> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiClient.post<Receipt>('/api/receipt/update', data);
      setSuccess(true);
      
      // Call parent callback with updated receipt
      onSave(response.data);

      // Auto-close after successful save
      setTimeout(() => {
        onCancel();
      }, 1500);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Failed to update receipt. Please try again.');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = (): void => {
    // Reset to original receipt data
    setFormData({
      receiptId: receipt.receiptId,
      extractedText: receipt.extractedText,
      title: receipt.title,
      description: receipt.description,
      vendor: receipt.vendor,
      state: receipt.state,
      city: receipt.city,
      country: receipt.country,
      imageUrl: receipt.imageUrl,
      tax: receipt.tax,
      total: receipt.total,
      purchaseDate: receipt.purchaseDate,
      categoryId: receipt.categoryId
    });
    setError(null);
    setSuccess(false);
  };

  if (!formData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading receipt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Receipts
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Receipt</h1>
          <p className="text-sm text-muted-foreground">
            Update receipt details and save changes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 rounded-xl bg-white p-8
                border border-black/5
                shadow-[0_10px_40px_rgba(0,0,0,0.1)]
                dark:bg-slate-900 dark:border-white/10 dark:shadow-[0_10px_40px_rgba(0,0,0,0.35)]
                lg:grid-cols-2">
        
        {/* Left: Receipt Image */}
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-slate-100">
            Receipt Image
          </h3>
          <div className="min-h-100 w-full rounded-xl border-2 border-solid border-gray-300 p-0 bg-black dark:bg-slate-950 dark:border-slate-700">
            <div className="flex h-full w-full items-center justify-center">
              {receipt.imageUrl ? (
                <img
                  src={`/receipt-images/${receipt.imageUrl}`}
                  alt="Receipt"
                  className="max-h-150 max-w-full object-contain rounded-xl"
                  onError={(e) => {
                    // Fallback for broken image URLs
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="flex flex-col items-center gap-4 text-muted-foreground">
                          <svg class="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <p>Image not available</p>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                  <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>No image available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Edit Form */}
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
              <strong className="mr-2 font-semibold">Success!</strong> Receipt updated successfully.
            </div>
          )}

          <ReceiptForm
            data={formData}
            categories={categories}
            onSave={handleSaveReceipt}
            onReset={handleReset}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default ReceiptEdit;
