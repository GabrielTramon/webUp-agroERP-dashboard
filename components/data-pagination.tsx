'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataPaginationProps {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function DataPagination({ page, total, limit, onPageChange, isLoading }: DataPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  if (total <= limit) return null;

  return (
    <div className="flex items-center justify-between border-t px-1 pt-4 mt-2">
      <p className="text-sm text-muted-foreground">
        {from}–{to} de {total} resultado{total !== 1 ? 's' : ''}
      </p>
      <div className="flex items-center gap-1">
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isLoading}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm tabular-nums px-2 min-w-16 text-center text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          size="icon-sm"
          variant="outline"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isLoading}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
