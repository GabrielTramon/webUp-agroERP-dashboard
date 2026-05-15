'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filterContent?: React.ReactNode;
  isFilterActive?: boolean;
  onClearFilters?: () => void;
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
  search,
  onSearchChange,
  searchPlaceholder = 'Pesquisar...',
  filterContent,
  isFilterActive,
  onClearFilters,
}: PageHeaderProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hasSearch = onSearchChange !== undefined;

  useEffect(() => {
    if (!isFilterOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isFilterOpen]);

  function handleClear() {
    onClearFilters?.();
    setIsFilterOpen(false);
  }

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-[1.1rem] w-[1.1rem] text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold leading-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>

      {hasSearch && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search ?? ''}
              onChange={(e) => onSearchChange!(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>

          {filterContent && (
            <div ref={wrapperRef} className="relative shrink-0">
              <Button
                variant="outline"
                className={cn('gap-1.5', isFilterActive && 'border-primary text-primary')}
                onClick={() => setIsFilterOpen((prev) => !prev)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {isFilterActive && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>

              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-xl border bg-background shadow-xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Filtros
                    </div>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="px-4 py-4 space-y-4">
                    {filterContent}
                  </div>

                  {onClearFilters && (
                    <div className="flex justify-end px-4 py-3 border-t">
                      <Button size="sm" variant="outline" onClick={handleClear}>
                        Limpar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
