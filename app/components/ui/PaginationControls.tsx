// components/ui/PaginationControls.tsx
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  loading: boolean;
}

export default function PaginationControls({ page, totalPages, onPageChange, loading }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        disabled={page === 1 || loading}
        onClick={() => onPageChange(page - 1)}
        className="p-2 rounded-full hover:bg-muted disabled:opacity-30 border border-border"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="text-sm font-medium">
        Trang {page} / {totalPages}
      </span>
      <button
        disabled={page === totalPages || loading}
        onClick={() => onPageChange(page + 1)}
        className="p-2 rounded-full hover:bg-muted disabled:opacity-30 border border-border"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}