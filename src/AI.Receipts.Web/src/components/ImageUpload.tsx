import React, { useRef } from 'react';
import './ImageUpload.css';
import { 
  isValidImageType, 
  isValidFileSize, 
  MAX_FILE_SIZE,
  SUPPORTED_IMAGE_TYPES 
} from '../types/FileStorage';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  imagePreview: string | null;
  disabled: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImageSelect, 
  imagePreview, 
  disabled 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!isValidImageType(file.type)) {
      return {
        valid: false,
        error: `Please select a valid image file. Supported formats: ${SUPPORTED_IMAGE_TYPES.join(', ')}`
      };
    }

    if (!isValidFileSize(file.size)) {
      const maxSizeMB = Math.floor(MAX_FILE_SIZE / (1024 * 1024));
      return {
        valid: false,
        error: `File size must be less than ${maxSizeMB}MB`
      };
    }

    return { valid: true };
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    onImageSelect(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();

    if (disabled) return;

    const file = event.dataTransfer.files[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    onImageSelect(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleClick = (): void => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const acceptedTypes = SUPPORTED_IMAGE_TYPES.join(',');
  const maxSizeMB = Math.floor(MAX_FILE_SIZE / (1024 * 1024));

  return (
    <div className="image-upload">
      <div
        className={`upload-area ${imagePreview ? 'has-image' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload receipt image"
      >
        {imagePreview ? (
          <div className="image-preview">
            <img src={imagePreview} alt="Receipt preview" />
          </div>
        ) : (
          <div className="upload-placeholder">
            <svg
              className="upload-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="upload-text">
              Drop an image here or click to browse
            </p>
            <p className="upload-hint">
              Supported formats: JPEG, PNG, BMP, GIF, TIFF, WebP (up to {maxSizeMB}MB)
            </p>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled}
        aria-label="File input for receipt image"
      />
    </div>
  );
};

export default ImageUpload;