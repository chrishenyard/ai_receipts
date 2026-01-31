import React, { useState, useEffect, useMemo } from 'react';
import { Receipt } from '../types/Receipt';
import { Category } from '../types/Category';
import { getErrorMessage } from '../utils/errorHandler';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState
} from '@tanstack/react-table';

interface ReceiptsTableProps {
  onEdit?: (receipt: Receipt) => void;
  onView?: (receipt: Receipt) => void;
  onDelete?: (receiptId: number) => void;
}

interface ReceiptWithCategory extends Receipt {
  categoryName?: string;
}

const ReceiptsTable: React.FC<ReceiptsTableProps> = ({
  onEdit,
  onView,
  onDelete
}) => {
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

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
  const receiptsWithCategories: ReceiptWithCategory[] = useMemo(() => {
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

  const handleDelete = async (receiptId: number): Promise<void> => {
    if (!confirm('Are you sure you want to delete this receipt?')) {
      return;
    }

    setError(null);
    deleteReceiptMutation.mutate(receiptId);
  };

  // Define table columns using standard ColumnDef approach
  const columns = useMemo<ColumnDef<ReceiptWithCategory>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            Title
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="max-w-50">
            <div className="truncate font-medium" title={row.getValue('title')}>
              {row.getValue('title')}
            </div>
            {row.original.description && (
              <div className="text-xs text-muted-foreground truncate mt-1" title={row.original.description}>
                {row.original.description}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'vendor',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            Vendor
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ getValue }) => getValue() as string,
      },
      {
        accessorKey: 'categoryName',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            Category
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            {(getValue() as string) || 'Uncategorized'}
          </span>
        ),
      },
      {
        id: 'location',
        header: 'Location',
        cell: ({ row }) => {
          const location = [row.original.city, row.original.state, row.original.country]
            .filter(Boolean)
            .join(', ');
          return <div className="text-sm">{location || '—'}</div>;
        },
      },
      {
        accessorKey: 'purchaseDate',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            Purchase Date
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ getValue }) => {
          const date = getValue() as string;
          if (!date) return '—';
          try {
            return new Date(date).toLocaleDateString();
          } catch {
            return date;
          }
        },
        sortingFn: 'datetime',
      },
      {
        accessorKey: 'total',
        header: ({ column }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-auto p-0 font-medium hover:bg-transparent"
            >
              Total
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          </div>
        ),
        cell: ({ getValue }) => {
          const amount = getValue() as number;
          return (
            <div className="text-right font-mono">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(amount)}
            </div>
          );
        },
        sortingFn: 'basic',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {onView && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onView(row.original)}
                title="View receipt"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEdit(row.original)}
                title="Edit receipt"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => row.original.receiptId && handleDelete(row.original.receiptId)}
              title="Delete receipt"
              className="text-destructive hover:text-destructive"
              disabled={deleteReceiptMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onView, onEdit, deleteReceiptMutation.isPending]
  );

  // Create table instance
  const table = useReactTable({
    data: receiptsWithCategories,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      pagination,
      globalFilter,
    },
  });

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

  const handleRetry = () => {
    setError(null);
    refetchReceipts();
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Receipts</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {table.getFilteredRowModel().rows.length} of {receiptsWithCategories.length} receipt{receiptsWithCategories.length !== 1 ? 's' : ''} 
              {globalFilter ? ' (filtered)' : ''}
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search receipts..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 rounded-lg border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={header.id === 'total' ? 'text-right' : ''}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No receipts found. Upload and scan your first receipt to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {table.getFilteredRowModel().rows.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">
                Show
              </p>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
                className="h-8 w-16 rounded border border-input bg-background px-2 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {[5, 10, 20, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
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
                  Page {table.getState().pagination.pageIndex + 1} of{' '}
                  {table.getPageCount()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronLeft className="h-4 w-4 -ml-2" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
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
