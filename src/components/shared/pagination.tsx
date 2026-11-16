import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Pagination as PaginationData } from '../../types/api'

type PaginationProps = {
  pagination: PaginationData
  onPageChange: (page: number) => void
  itemLabel?: string
}

export default function Pagination({ pagination, onPageChange, itemLabel = 'items' }: PaginationProps) {
  const { page, total, totalPages } = pagination

  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <p className="text-sm text-muted">
        {total} {itemLabel}{totalPages > 0 && ` · Page ${page} of ${totalPages}`}
      </p>
      {(totalPages > 1 || page > 1) && (
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-input-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"><ChevronLeft size={16} aria-hidden="true" />Previous</button>
          <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-input-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50">Next<ChevronRight size={16} aria-hidden="true" /></button>
        </div>
      )}
    </nav>
  )
}
