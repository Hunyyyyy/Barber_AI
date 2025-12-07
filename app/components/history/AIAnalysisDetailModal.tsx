"use client";

import { cn } from "@/lib/utils"; // Giả sử bạn có cn utility, nếu không có thể dùng template string
import { GeminiResponse } from "@/types/hairstyle";
import { Check, Palette, Scissors, Sparkles, ThumbsDown, ThumbsUp, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface AnalysisItem {
  id: string;
  originalImageUrl: string;
  analysisResult: GeminiResponse; 
  createdAt: string | Date;
}

interface Props {
  item: AnalysisItem | null;
  onClose: () => void;
}

export default function AIAnalysisDetailModal({ item, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'styles'>('overview');

  if (!item) return null;

  const { general_advice, hairstyles } = item.analysisResult;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="relative bg-background w-full max-w-5xl h-[90vh] md:h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Kết quả phân tích</h2>
              <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Column: Image & Face Shape (Sticky on Desktop) */}
          <div className="w-full md:w-[350px] bg-muted/30 p-6 flex flex-col gap-6 border-r border-border overflow-y-auto shrink-0">
            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-sm border border-border group">
              <Image 
                src={item.originalImageUrl} 
                alt="User" 
                fill 
                className="object-cover transition-transform duration-500 group-hover:scale-105" 
              />
            </div>
            
            
          </div>

          {/* Right Column: Content with Tabs */}
          <div className="flex-1 flex flex-col bg-card h-full min-h-0">
            {/* Tabs Header */}
            <div className="flex border-b border-border">
              <button 
                onClick={() => setActiveTab('overview')}
                className={cn(
                  "flex-1 py-4 text-sm font-semibold border-b-2 transition-colors",
                  activeTab === 'overview' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Lời khuyên tổng quan
              </button>
              <button 
                onClick={() => setActiveTab('styles')}
                className={cn(
                  "flex-1 py-4 text-sm font-semibold border-b-2 transition-colors",
                  activeTab === 'styles' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Kiểu tóc đề xuất ({hairstyles.length})
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  {/* Technical Advice Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
                      <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                        <Scissors className="w-5 h-5" />
                        <span className="font-bold text-sm">Xử lý tóc</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Uốn:</span> {general_advice.should_perm}</p>
                        <p><span className="font-medium">Ép side:</span> {general_advice.should_side_press}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900">
                      <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400">
                        <Palette className="w-5 h-5" />
                        <span className="font-bold text-sm">Màu sắc</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>{general_advice.color_suggestion}</p>
                        <p className="text-xs opacity-80">({general_advice.dyeing_method})</p>
                      </div>
                    </div>
                  </div>

                  {/* Do's and Don'ts */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2 text-green-600">
                        <ThumbsUp className="w-4 h-4" /> Nên làm
                      </h4>
                      <ul className="grid gap-2">
                        {general_advice.aftercare_do.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2 text-red-500">
                        <ThumbsDown className="w-4 h-4" /> Nên tránh
                      </h4>
                      <ul className="grid gap-2">
                        {general_advice.aftercare_dont.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                            <X className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STYLES */}
              {activeTab === 'styles' && (
                <div className="grid gap-6 animate-in slide-in-from-right-4 duration-300">
                  {hairstyles.map((style, index) => (
                    <div key={index} className="group border border-border rounded-2xl p-5 hover:border-primary/50 transition-colors bg-card hover:shadow-md">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                            {style.name}
                          </h3>
                          <p className="text-sm text-muted-foreground font-medium">{style.english_name}</p>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 bg-muted rounded-full text-muted-foreground">
                          Top {index + 1}
                        </span>
                      </div>
                      
                      <div className="relative pl-4 border-l-2 border-primary/30 my-4 space-y-2">
                        <p className="text-sm italic text-muted-foreground">"{style.why_suitable}"</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-dashed border-border">
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Bảo dưỡng</p>
                          <p>{style.maintenance}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Sản phẩm</p>
                          <p>{style.recommended_products}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-2">
                         <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Cách vuốt</p>
                         <p className="text-sm text-foreground/80">{style.how_to_style}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}