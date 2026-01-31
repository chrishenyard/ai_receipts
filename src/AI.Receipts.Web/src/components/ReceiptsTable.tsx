import React, { useState, useEffect } from 'react';
import { Receipt } from '../types/Receipt';
import { Category } from '../types/Category';
import { getErrorMessage } from '../utils/errorHandler';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';

interface ReceiptsTableProps {
  onEdit?: (receipt: Receipt) => void;
  onView?: (receipt: Receipt) => void;
  onDelete?: (receiptId: number) => void;
}

interface ReceiptWithCategory extends Receipt {
  categoryName?: string;
}

const ITEMS_PER_PAGE = 10;
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

const ReceiptsTable: React.FC<ReceiptsTableProps> = ({
  onEdit,
  onView,
  onDelete
}) => {
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(ITEMS_PER_PAGE);

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

  // Load receipts using TanStack React Query
  const {
    data: receiptsData = [],
    isLoading: receiptsLoading,
    error: receiptsError,
    refetch: refetchReceipts
  } = useQuery({
    queryKey: ['receipts'],
    queryFn: async (): Promise<Receipt[]> => {
      const response = await apiClient.get<Receipt[]>('/api/receipts');
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete receipt mutation
  const deleteReceiptMutation = useMutation({
    mutationFn: async (receiptId: number): Promise<void> => {
      await apiClient.delete(`/api/receipt/delete/${receiptId}`);
    },
    onSuccess: (_, receiptId) => {
      // Invalidate receipts query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      
      // Also invalidate the specific receipt query
      queryClient.invalidateQueries({ queryKey: ['receipt', receiptId] });
      
      setError(null);
      
      if (onDelete) {
        onDelete(receiptId);
      }
    },
    onError: (err) => {
      const errorMessage = getErrorMessage(err, 'Failed to delete receipt.');
      setError(errorMessage);
      console.error('Failed to delete receipt:', err);
    }
  });

  // Combine receipts with category names
  const receiptsWithCategories: ReceiptWithCategory[] = React.useMemo(() => {
    if (!receiptsData.length || !categories.length) {
      return receiptsData.map(receipt => ({
        ...receipt,
        categoryName: 'Loading...'
      }));
    }

    // Create a map of category IDs to names for quick lookup
    const categoryMap = new Map<number, string>();
    categories.forEach(category => {
      categoryMap.set(category.categoryId, category.name);
    });

    return receiptsData.map(receipt => ({
      ...receipt,
      categoryName: categoryMap.get(receipt.categoryId) || 'Uncategorized'
    }));
  }, [receiptsData, categories]);

  // Update error state if queries fail
  useEffect(() => {
    if (categoriesError && !error) {
      const errorMessage = getErrorMessage(categoriesError, 'Failed to load categories.');
      setError(errorMessage);
    } else if (receiptsError && !error) {
      const errorMessage = getErrorMessage(receiptsError, 'Failed to load receipts.');
      setError(errorMessage);
    }
  }, [categoriesError, receiptsError, error]);

  const handleDelete = async (receiptId: number): Promise<void> => {
    if (!confirm('Are you sure you want to delete this receipt?')) {
      return;
    }

    setError(null);
    deleteReceiptMutation.mutate(receiptId);
  };

  const handleRetry = () => {
    setError(null);
    refetchReceipts();
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Pagination calculations
  const totalItems = receiptsWithCategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReceipts = receiptsWithCategories.slice(startIndex, endIndex);

  // Reset to first page when itemsPerPage changes
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Reset to first page when receipts change (after delete)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Combined loading state
  const isLoading = categoriesLoading || receiptsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading receipts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-100 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-950/60 dark:text-red-200">
        <strong className="mr-2 font-semibold">Error:</strong> {error}
        <Button
          variant="outline"
          size="sm"
          className="ml-4"
          onClick={handleRetry}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white border border-black/5 shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:bg-slate-900 dark:border-white/10 dark:shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-semibold tracking-tight">Receipts</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {receiptsWithCategories.length} receipt{receiptsWithCategories.length !== 1 ? 's' : ''} found
        </p>
      </div>
      
      <div className="p-6">
        <Table>
          <TableCaption>
            {receiptsWithCategories.length === 0 
              ? 'No receipts found. Upload and scan your first receipt to get started.'
              : `Showing ${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems} receipt${totalItems !== 1 ? 's' : ''}.`
            }
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-30">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receiptsWithCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No receipts available
                </TableCell>
              </TableRow>
            ) : (
              currentReceipts.map((receipt) => (
                <TableRow key={receipt.receiptId}>
                  <TableCell className="font-medium max-w-50">
                    <div className="truncate" title={receipt.title}>
                      {receipt.title}
                    </div>
                    {receipt.description && (
                      <div className="text-xs text-muted-foreground truncate mt-1" title={receipt.description}>
                        {receipt.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{receipt.vendor}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {receipt.categoryName}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {[receipt.city, receipt.state, receipt.country]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {receipt.purchaseDate ? formatDate(receipt.purchaseDate) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(receipt.total)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {onView && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onView(receipt)}
                          title="View receipt"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onEdit(receipt)}
                          title="Edit receipt"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => receipt.receiptId && handleDelete(receipt.receiptId)}
                        title="Delete receipt"
                        className="text-destructive hover:text-destructive"
                        disabled={deleteReceiptMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>        
        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">
                Show
              </p>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="h-8 w-16 rounded border border-input bg-background px-2 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">
                per page
              </p>
            </div>
            
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronLeft className="h-4 w-4 -ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4 -ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}      
      </div>
    </div>
  );
};

export default ReceiptsTable;
