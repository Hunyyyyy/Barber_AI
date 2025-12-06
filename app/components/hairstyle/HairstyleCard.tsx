// app/components/hairstyle/HairstyleCard.tsx
"use client";

import { Hairstyle } from "@/types/hairstyle";
import { ChevronLeft, ChevronRight, Clock, ShoppingBag, Star, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
interface Props {
  hairstyle: Hairstyle | null;
  onClose: () => void;
}

export default function HairstyleDetailModal({ hairstyle, onClose }: Props) {
  const [images, setImages] = useState<string[]>([]);
  const [loadingImg, setLoadingImg] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
const [mounted, setMounted] = useState(false);
useEffect(() => {
    setMounted(true); // Đánh dấu đã mount trên client
    return () => setMounted(false);
  }, []);
  useEffect(() => {
    if (!hairstyle) return;
    setLoadingImg(true);
    
    // Khóa scroll body
    document.body.style.overflow = "hidden";
    
    const fetchImages = async () => {
      try {
        const name = encodeURIComponent(hairstyle.english_name || hairstyle.name);
        const res = await fetch(`/api/search-hairstyle-image?name=${name}&gender=male`);
        const data = await res.json();
        setImages(data.imageUrls?.slice(0, 5) || ["https://placehold.co/600x800?text=No+Image"]);
      } catch (error) {
        setImages(["https://placehold.co/600x800?text=Error"]);
      } finally {
        setLoadingImg(false);
      }
    };
    fetchImages();

    return () => { document.body.style.overflow = "auto"; };
  }, [hairstyle]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -clientWidth : clientWidth, behavior: 'smooth' });
    }
  };

  if (!hairstyle) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6">
      {/* Overlay */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Container: Full màn hình trên mobile (100dvh) */}
      <div className="relative w-full h-[100dvh] md:max-w-5xl md:h-[85vh] bg-card text-card-foreground md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border">
        
        {/* Close Button Mobile: Tăng z-index và làm nổi bật */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-50 p-2.5 bg-black/60 text-white rounded-full md:hidden backdrop-blur-md active:scale-95 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LEFT: IMAGE GALLERY */}
        {/* Mobile: Cao 35% màn hình | Desktop: Cao 100% */}
        <div className="relative w-full h-[35vh] md:w-1/2 md:h-full bg-muted group shrink-0">
          {loadingImg && (
            <div className="absolute inset-0 flex items-center justify-center z-10 text-muted-foreground bg-muted/50">
               <span className="loading-spinner">Loading...</span> 
            </div>
          )}

          <div
            ref={scrollRef}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide "
            style={{ scrollbarWidth: "none" }}
          >
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt="Hairstyle"
                className="w-full h-full object-cover flex-shrink-0 snap-center block"
              />
            ))}
          </div>

          {/* Controls */}
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <button onClick={() => scroll('left')} className="pointer-events-auto p-2 bg-background/80 rounded-full shadow-sm hover:bg-background text-foreground cursor-pointer"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => scroll('right')} className="pointer-events-auto p-2 bg-background/80 rounded-full shadow-sm hover:bg-background text-foreground cursor-pointer"><ChevronRight className="w-5 h-5" /></button>
          </div>
          
          {/* Mobile Image Indicator (Dots) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
             {images.map((_, idx) => (
                <div key={idx} className="w-1.5 h-1.5 rounded-full bg-white/60" />
             ))}
          </div>
        </div>

        {/* RIGHT: INFO */}
        <div className="w-full md:w-1/2 flex flex-col flex-1 bg-card relative overflow-y-auto">
          {/* Header Sticky */}
          <div className="flex items-start justify-between p-5 md:p-6 border-b border-border bg-card sticky top-0 z-10 shadow-sm md:shadow-none">
            <div>
              <h2 className="text-xl md:text-3xl font-bold text-foreground tracking-tight">{hairstyle.name}</h2>
              <p className="text-muted-foreground font-medium text-xs md:text-sm mt-1">{hairstyle.english_name}</p>
            </div>
            {/* Desktop Close Button */}
            <button onClick={onClose} className="hidden md:block p-2 hover:bg-accent hover:text-accent-foreground rounded-full transition text-muted-foreground cursor-pointer">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 md:space-y-8 pb-10">
            
            {/* Why Suitable */}
            <div className="space-y-2 md:space-y-3">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Star className="w-4 h-4 text-orange-500" /> Điểm nổi bật
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm md:text-base border-l-2 border-primary pl-4">
                {hairstyle.why_suitable}
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="p-3 md:p-4 rounded-xl border border-border bg-muted/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Độ khó</p>
                <p className="mt-1 font-semibold text-sm md:text-base text-foreground flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" /> {hairstyle.maintenance}
                </p>
              </div>
              <div className="p-3 md:p-4 rounded-xl border border-border bg-muted/50">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Icon</p>
                <p className="mt-1 font-semibold text-sm md:text-base text-foreground truncate">
                  {hairstyle.celebrity_example || "N/A"}
                </p>
              </div>
            </div>

            {/* How to Style */}
            <div className="space-y-2 md:space-y-3">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" /> Cách tạo kiểu
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed text-justify">
                {hairstyle.how_to_style}
              </p>
            </div>

            {/* Products */}
            <div className="space-y-2 md:space-y-3">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-500" /> Sản phẩm khuyên dùng
              </h3>
              <div className="flex flex-wrap gap-2">
                {hairstyle.recommended_products.split(", ").map((p, i) => (
                  <span key={i} className="px-2.5 py-1.5 md:px-3 md:py-1.5 border border-border text-muted-foreground rounded-lg text-xs font-medium bg-background">
                    {p.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,document.body
  );
}