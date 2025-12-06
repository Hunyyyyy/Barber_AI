"use client";

import { Hairstyle } from "@/types/hairstyle";
import { ChevronLeft, ChevronRight, Clock, ShoppingBag, Star, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  hairstyle: Hairstyle | null;
  onClose: () => void;
}

export default function HairstyleDetailModal({ hairstyle, onClose }: Props) {
  const [images, setImages] = useState<string[]>([]);
  const [loadingImg, setLoadingImg] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch ảnh (giữ nguyên logic fetch nhưng clean code hơn)
  useEffect(() => {
    if (!hairstyle) return;
    setLoadingImg(true);
    
    // Khóa scroll body
   

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

  // Scroll logic đơn giản hơn
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -clientWidth : clientWidth, behavior: 'smooth' });
    }
  };

  if (!hairstyle) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6">
      {/* Overlay: Màu đen mờ nhẹ, bỏ blur để đỡ lag */}
      <div className="absolute inset-0 bg-black/60 transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full h-full md:max-w-5xl md:h-[85vh] bg-white md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button Mobile */}
        <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full md:hidden backdrop-blur-sm">
          <X className="w-5 h-5" />
        </button>

        {/* LEFT: IMAGE GALLERY */}
        <div className="relative w-full md:w-1/2 h-[40vh] md:h-full bg-neutral-100 group">
          {loadingImg && (
            <div className="absolute inset-0 flex items-center justify-center z-10 text-neutral-400">
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
            <button onClick={() => scroll('left')} className="pointer-events-auto p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-black cursor-pointer"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => scroll('right')} className="pointer-events-auto p-2 bg-white/90 rounded-full shadow-sm hover:bg-white text-black cursor-pointer"><ChevronRight className="w-5 h-5" /></button>
          </div>
        </div>

        {/* RIGHT: INFO */}
        <div className="w-full md:w-1/2 flex flex-col h-[60vh] md:h-full bg-white relative overflow-y-auto">
          {/* Header Sticky */}
          <div className="flex items-start justify-between p-6 border-b border-neutral-100 bg-white sticky top-0 z-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">{hairstyle.name}</h2>
              <p className="text-neutral-500 font-medium text-sm mt-1">{hairstyle.english_name}</p>
            </div>
            <button onClick={onClose} className="hidden md:block p-2 hover:bg-neutral-100 rounded-full transition text-neutral-400 hover:text-black cursor-pointer">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Why Suitable */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <Star className="w-4 h-4" /> Điểm nổi bật
              </h3>
              <p className="text-neutral-600 leading-relaxed text-sm md:text-base border-l-2 border-black pl-4">
                {hairstyle.why_suitable}
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50">
                <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">Maintenance</p>
                <p className="mt-1 font-semibold text-neutral-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-500" /> {hairstyle.maintenance}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50">
                <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">Icon</p>
                <p className="mt-1 font-semibold text-neutral-900 truncate">
                  {hairstyle.celebrity_example || "N/A"}
                </p>
              </div>
            </div>

            {/* How to Style */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Styling Guide
              </h3>
              <p className="text-neutral-600 text-sm leading-relaxed">
                {hairstyle.how_to_style}
              </p>
            </div>

            {/* Products */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Products
              </h3>
              <div className="flex flex-wrap gap-2">
                {hairstyle.recommended_products.split(", ").map((p, i) => (
                  <span key={i} className="px-3 py-1.5 border border-neutral-200 text-neutral-600 rounded-lg text-xs font-medium bg-white">
                    {p.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          {/* <div className="p-6 border-t border-neutral-100 bg-white">
            <button className="w-full py-3.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition shadow-lg shadow-neutral-200 cursor-pointer">
              Save to Collection
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
}