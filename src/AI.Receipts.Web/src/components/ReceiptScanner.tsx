import React, { useState, useEffect } from 'react';
import apiClient, { fetchCsrfToken } from '../services/api';
import ImageUpload from './ImageUpload';
import ReceiptForm from './ReceiptForm';
import './ReceiptScanner.css';
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
          'Content-Type': 'multipart/form-data',
        },
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
        imageUrl: data.imageUrl || imageFile?.name || '',
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
    <div className="receipt-scanner">
      <div className="scanner-container">
        <div className="image-section">
          <ImageUpload
            onImageSelect={handleImageSelect}
            imagePreview={imagePreview}
            disabled={loading}
          />
          
          {imageFile && !receiptData && (
            <button
              className="btn btn-primary scan-button"
              onClick={handleScanReceipt}
              disabled={loading}
            >
              {loading ? 'Scanning...' : 'Scan Receipt'}
            </button>
          )}
        </div>

        <div className="form-section">
          {error && (
            <div className="alert alert-error" role="alert">
              <strong>Error:</strong> {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              <strong>Success!</strong> Receipt saved successfully.
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