"use client";

import { Calendar, Download, X } from "lucide-react";
import Image from "next/image";

interface Props {
  item: any;
  onClose: () => void;
}

export default function CollectionDetailModal({ item, onClose }: Props) {
  if (!item) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row bg-transparent md:bg-card md:rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng cho mobile */}
        <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full md:hidden">
            <X className="w-5 h-5"/>
        </button>

        {/* Cột ảnh - Chiếm phần lớn diện tích */}
        <div className="relative flex-1 h-[60vh] md:h-auto bg-black flex items-center justify-center">
            <Image 
                src={item.imageUrl} 
                alt={item.styleName} 
                fill 
                className="object-contain"
            />
        </div>

        {/* Cột thông tin - Bên phải trên Desktop, Dưới cùng trên Mobile */}
        <div className="bg-card w-full md:w-[320px] p-6 flex flex-col text-card-foreground">
            <div className="flex-1">
                <h2 className="text-2xl font-bold text-primary mb-1">{item.styleName}</h2>
                <p className="text-muted-foreground text-sm font-medium mb-6">Đã lưu trong bộ sưu tập</p>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-foreground/80">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Đã lưu: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    {/* Nếu có thêm field ghi chú có thể hiển thị ở đây */}
                </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-8 md:mt-0 pt-6 border-t border-border space-y-3">
                <button 
                    onClick={() => window.open(item.imageUrl, '_blank')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                    <Download className="w-4 h-4" /> Tải ảnh gốc
                </button>
                <button 
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl border border-border text-foreground hover:bg-muted font-medium transition-colors"
                >
                    Đóng
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}