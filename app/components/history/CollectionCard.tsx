'use client';

import { ImageIcon } from 'lucide-react';
import Image from 'next/image';

export default function CollectionCard({ item }: { item: any }) {
  return (
    // SỬA: rounded-2xl overflow-hidden
    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-shadow duration-500">
        <Image src={item.imageUrl} alt={item.styleName} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-xs font-medium opacity-80 uppercase tracking-widest mb-1 text-gray-300">Kiểu tóc</p>
            <h3 className="font-bold text-lg leading-tight text-white">{item.styleName}</h3>
            <p className="text-[10px] opacity-60 mt-1 italic text-gray-400">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</p>
        </div>
        
        {/* Nút hành động ẩn */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button className="bg-white/10 backdrop-blur-md p-2 rounded-full hover:bg-white text-white hover:text-black transition-colors border border-white/20">
                <ImageIcon className="w-4 h-4" />
            </button>
        </div>
    </div>
  );
}