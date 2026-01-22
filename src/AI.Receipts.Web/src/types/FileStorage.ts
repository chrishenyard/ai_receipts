export interface FileStorageSettings {
  uploadPath: string;
  maxFileSizeBytes: number;
}

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/bmp',
  'image/gif',
  'image/tiff',
  'image/webp',
] as const;

export type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const isValidImageType = (contentType: string): contentType is SupportedImageType => {
  return SUPPORTED_IMAGE_TYPES.includes(contentType as SupportedImageType);
};

export const isValidFileSize = (size: number): boolean => {
  return size > 0 && size <= MAX_FILE_SIZE;
};