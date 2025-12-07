"use client";

import { deleteTransaction, getTransactionHistory } from "@/actions/history.actions";
import PaginationControls from "@/components/ui/PaginationControls";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import EmptyState from "./EmptyState";
import TransactionCard from "./TransactionCard";

export default function TransactionList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const res = await getTransactionHistory(page, 10);
    if (res.success) {
      setData(res.data||[]);
      setTotalPages(res.totalPages || 1);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    if (!confirm("Xóa lịch sử giao dịch này?")) return;

    setDeletingId(id);
    try {
      const res = await deleteTransaction(id);
      if (res.success) {
        toast.success("Đã xóa giao dịch");
        setData(prev => prev.filter(item => item.id !== id));
      } else {
        toast.error("Không thể xóa giao dịch");
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && data.length === 0) return <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground"/></div>;

  if (!loading && data.length === 0) return <EmptyState title="Chưa có giao dịch" desc="Lịch sử nạp Credit sẽ hiện ở đây." href="/profile" btn="Nạp Credit" />;

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
      {data.map((item) => {
         const isDeleting = deletingId === item.id;
         return (
           <div key={item.id} className={`relative group/wrapper ${isDeleting ? 'opacity-60 pointer-events-none' : ''}`}>
              <TransactionCard item={item} />
              <button 
                onClick={() => handleDelete(item.id)}
                disabled={isDeleting}
                className="absolute top-1/2 -translate-y-1/2 right-4 p-2 bg-card border shadow-sm text-red-500 rounded-full opacity-0 group-hover/wrapper:opacity-100 transition-opacity hover:bg-red-50 translate-x-10 group-hover/wrapper:translate-x-0 disabled:translate-x-0 disabled:opacity-100"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
           </div>
         )
      })}
      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
    </div>
  );
}