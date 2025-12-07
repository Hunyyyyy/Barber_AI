"use client";

import { deleteSavedItem, getSavedCollection } from "@/actions/history.actions";
import PaginationControls from "@/components/ui/PaginationControls";
import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import CollectionCard from "./CollectionCard";
import CollectionDetailModal from "./CollectionDetailModal"; // Import modal mới
import EmptyState from "./EmptyState";

export default function CollectionList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null); // State loading khi xóa
  const [selectedItem, setSelectedItem] = useState<any | null>(null); // State modal

  const fetchData = async () => {
    setLoading(true);
    const res = await getSavedCollection(page, 9);
    if (res.success) {
      setData(res.data || []);
      setTotalPages(res.totalPages || 1);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page]);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    if (!confirm("Bạn có chắc chắn muốn xóa kiểu tóc này khỏi bộ sưu tập?")) return;

    setDeletingId(id);
    try {
      const res = await deleteSavedItem(id);
      if (res.success) {
        toast.success("Đã xóa khỏi bộ sưu tập");
        // Update local state để UI nhanh hơn, đỡ phải fetch lại
        setData(prev => prev.filter(item => item.id !== id));
      } else {
        toast.error(res.error || "Lỗi xóa");
      }
    } catch (error) {
       toast.error("Lỗi hệ thống");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && data.length === 0) return <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground"/></div>;

  if (!loading && data.length === 0) return <EmptyState title="Trống" desc="Lưu các kiểu tóc bạn thích." href="/try-hair" btn="Khám phá" />;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4">
        {data.map((item) => {
          const isDeleting = deletingId === item.id;
          return (
            <div key={item.id} className="relative group/wrapper" onClick={() => setSelectedItem(item)}>
              <div className={isDeleting ? "opacity-50 pointer-events-none" : ""}>
                 <CollectionCard item={item} />
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                disabled={isDeleting}
                className="absolute top-2 right-2 z-10 p-2 bg-black/60 backdrop-blur-md text-white rounded-full opacity-0 group-hover/wrapper:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-100 disabled:bg-black/40"
                title="Xóa"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          )
        })}
      </div>
      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
      
      {/* Modal chi tiết */}
      <CollectionDetailModal 
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}