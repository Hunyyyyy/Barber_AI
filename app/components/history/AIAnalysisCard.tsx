'use client';

import { Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function AIAnalysisCard({ item, onClick }: { item: any, onClick: () => void }) {
  return (
    <div onClick={onClick} className="cursor-pointer bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all duration-300 group">
      <div className="relative aspect-[3/4] bg-muted border-b border-border">
          {/* Ảnh gốc */}
          <Image 
              src={item.originalImageUrl} 
              alt="Original" 
              fill 
              className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          />
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded">
              {new Date(item.createdAt).toLocaleDateString('vi-VN')}
          </div>
      </div>
      
      <div className="p-4">
          <h4 className="font-bold text-sm mb-1 flex items-center gap-2 text-foreground">
              <Sparkles className="w-3 h-3 text-primary" />
              Phân tích khuôn mặt
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              Kết quả: {JSON.stringify(item.analysisResult.faceShape || 'Đang cập nhật...')}
          </p>
          
          {/* List ảnh đã generate từ lần này */}
          {item.generatedStyles.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {item.generatedStyles.map((style: any) => (
                      <div key={style.id} className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                          <Image src={style.generatedImageUrl} alt="Generated" fill className="object-cover" />
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
}