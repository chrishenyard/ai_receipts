import React, { useRef } from 'react';
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

  const baseUploadArea =
    'min-h-[400px] w-full cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center ' +
    'transition-all duration-300 ease-in-out flex items-center justify-center ' +
    'dark:border-slate-700 dark:bg-slate-900';
  const hoverUploadArea = !disabled && !imagePreview
    ? 'hover:border-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-800'
    : '';
  const disabledUploadArea = disabled ? 'opacity-60 cursor-not-allowed' : '';
  const hasImageArea = imagePreview ? 'border-solid p-0 bg-black dark:bg-slate-950' : '';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <div
        className={`${baseUploadArea} ${hoverUploadArea} ${disabledUploadArea} ${hasImageArea}`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload receipt image"
      >
        {imagePreview ? (
          <div className="flex h-full w-full items-center justify-center">
            <img
              src={imagePreview}
              alt="Receipt preview"
              className="max-h-[600px] max-w-full object-contain rounded-xl"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <svg
              className="h-16 w-16 text-gray-400 dark:text-slate-400"
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
            <p className="m-0 text-[1.1rem] font-medium text-gray-800 dark:text-slate-100">
              Drop an image here or click to browse
            </p>
            <p className="m-0 text-[0.9rem] text-gray-500 dark:text-slate-400">
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
