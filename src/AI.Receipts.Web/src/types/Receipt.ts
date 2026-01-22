export interface Receipt {
  receiptId?: number;
  extractedText: string;
  title: string;
  description: string;
  vendor: string;
  state: string;
  city: string;
  country: string;
  imageUrl: string;
  amount: number;
  tax: number;
  total: number;
  purchaseDate: string;
  createdAt?: string;
  updatedAt?: string;
  categoryId: number;
}

export interface ReceiptFormData {
  extractedText: string;
  title: string;
  description: string;
  vendor: string;
  state: string;
  city: string;
  country: string;
  imageUrl: string;
  tax: number;
  total: number;
  purchaseDate: string;
  categoryId: number;
}