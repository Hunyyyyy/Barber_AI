"use client";

import { saveAnalysisResult } from "@/actions/save_try_hair.actions";
import HairstyleDetailModal from "@/components/hairstyle/HairstyleCard";
import TryOnModal from "@/components/hairstyle/TryOnModal";
import { createClient } from "@/lib/supabase/client";
import type { GeneralAdvice, Hairstyle } from "@/types/hairstyle";
import { AlertCircle, Camera, ChevronDown, ChevronRight, Info, Loader2, RefreshCcw, Scissors, Sparkles, Upload, Wand2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
// --- Utility Functions (Giữ nguyên) ---
const hexToRgb = (hex: string): [number, number, number] => {
  const cleanHex = hex.startsWith("#") ? hex.slice(1) : hex;
  const bigint = parseInt(cleanHex, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

const getTextColorClass = (hexColor: string): string => {
  try {
    const [r, g, b] = hexToRgb(hexColor);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.5 ? 'text-gray-900' : 'text-white';
  } catch { return 'text-white'; }
};

export default function SuggestPage() {
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [image, setImage] = useState<string | null>(null);
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>([]);
  const [generalAdvice, setGeneralAdvice] = useState<GeneralAdvice | null>(null);
  const supabase = createClient();
  
  const [selectedHairstyle, setSelectedHairstyle] = useState<Hairstyle | null>(null);
  const [selectedTryOn, setSelectedTryOn] = useState<Hairstyle | null>(null); 
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const resultsRef = useRef<HTMLDivElement>(null);
 useEffect(() => {
    // Kiểm tra xem có modal nào đang mở không
    const isModalOpen = selectedHairstyle || selectedTryOn;

    if (isModalOpen) {
        // A. KHI MỞ MODAL:
        
        // 1. Lưu lại vị trí hiện tại (ví dụ: đang ở 1500px)
        scrollPositionRef.current = window.scrollY;

        // 2. Khóa cuộn body để tránh trượt nền đằng sau
        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed"; // Cố định cứng trên iOS
        document.body.style.width = "100%";
        document.body.style.top = `-${scrollPositionRef.current}px`; // Giữ nguyên visual

        // 3. (Tuỳ chọn) Cuộn cửa sổ về 0 (nhưng do dùng position fixed ở trên nên visual đã đứng yên)
        // Nếu bạn muốn Modal luôn bắt đầu từ đỉnh màn hình viewport:
        // Đoạn code CSS 'fixed inset-0' trong Modal đã đảm bảo việc này.
        
    } else {
        // B. KHI ĐÓNG MODAL:

        // 1. Gỡ bỏ khóa cuộn
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("position");
        document.body.style.removeProperty("width");
        document.body.style.removeProperty("top");

        // 2. Lập tức đưa người dùng về đúng vị trí cũ (Restore)
        window.scrollTo({
            top: scrollPositionRef.current,
            behavior: "instant" // Dùng instant để không thấy hiệu ứng trượt, cảm giác mượt hơn
        });
    }
  }, [selectedHairstyle, selectedTryOn]);
  useEffect(() => {
    if (step === "result" && resultsRef.current) {
        setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
    }
  }, [step]);

  // B. (Tùy chọn) Tự động cuộn lên đầu trang khi mở Modal để giao diện sạch hơn
  // Lưu ý: Nếu muốn giữ vị trí người dùng đang đứng thì KHÔNG dùng cái này.
  // Nhưng trên mobile, cuộn lên đầu giúp tránh lỗi thanh địa chỉ che mất modal.
  // useEffect(() => {
  //   if (selectedHairstyle || selectedTryOn) {
  //       window.scrollTo({ top: 0, behavior: "smooth" });
  //   }
  // }, [selectedHairstyle, selectedTryOn]);
  // --- Logic Handlers (Giữ nguyên) ---
  const handleFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Vui lòng chọn file ảnh");
    if (file.size > 10 * 1024 * 1024) return setError("Ảnh < 10MB thôi nhé");
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target?.result as string);
      setStep("preview");
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setShowCamera(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { setError("Không bật được camera trên thiết bị này :("); }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    setImage(canvas.toDataURL("image/jpeg", 0.9));
    stopCamera();
    setStep("preview");
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setShowCamera(false);
  };

  const reset = () => {
    setImage(null); setHairstyles([]); setStep("upload"); setError(null); setGeneralAdvice(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analyzeImage = async () => {
    if (!image) return;
    setIsLoading(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Vui lòng đăng nhập để sử dụng tính năng này!");
      
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ imageBase64: image.split(",")[1] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi server");
      
      setGeneralAdvice(data.general_advice);
      setHairstyles(data.hairstyles || []);
      
      saveAnalysisResult(image, data).then(result => {
          if (result.success && result.analysisId) setAnalysisId(result.analysisId);
      });
      setStep("result");
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  }

  // --- RENDER ---
return (
    <main className="min-h-screen bg-transparent text-foreground font-sans pb-20 md:pb-0 relative" >
      
      {/* 1. Header Minimal */}
      <header className="py-4 md:py-8 text-center sticky top-0 bg-white/80 md:bg-transparent backdrop-blur-md z-30 md:static border-b md:border-none border-border">
        <h1 className="text-xl md:text-3xl font-black tracking-tighter cursor-pointer" onClick={reset}>
          AI BARBER<span className="text-muted-foreground">.</span>
        </h1>
      </header>

      <div className="w-full mx-auto pt-4 md:pt-0">
        
        {/* === STEP 1: UPLOAD === */}
        {step === "upload" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center px-4">
            <div className="mb-8 md:mb-12 mt-4 md:mt-10">
               <div className="w-16 h-16 md:w-24 md:h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-sm border border-border">
                 <Scissors className="w-8 h-8 md:w-12 md:h-12 text-foreground" />
               </div>
               <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 text-foreground">Tư vấn kiểu tóc AI</h2>
               <p className="text-muted-foreground text-sm md:text-lg px-6">Phân tích khuôn mặt & Gợi ý kiểu tóc chuẩn Salon</p>
            </div>
               
            <div className="flex flex-col gap-3 md:gap-4 max-w-sm mx-auto w-full">
                <button onClick={startCamera} className="flex items-center justify-center gap-3 p-4 md:p-5 rounded-xl md:rounded-2xl bg-primary text-primary-foreground font-bold text-base md:text-lg hover:opacity-90 transition shadow-lg md:shadow-xl shadow-primary/20 cursor-pointer active:scale-95">
                   <Camera className="w-5 h-5 md:w-6 md:h-6" /> Chụp ảnh Selfie
                </button>
                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Hoặc</span></div>
                </div>
                <label className="flex items-center justify-center gap-3 p-4 md:p-5 rounded-xl md:rounded-2xl border border-border bg-card text-card-foreground font-bold text-base md:text-lg hover:bg-accent transition cursor-pointer active:scale-95">
                   <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
                   <Upload className="w-5 h-5 md:w-6 md:h-6" /> Tải ảnh lên
                </label>
            </div>
            <p className="mt-8 text-[10px] md:text-xs text-muted-foreground">Dữ liệu của bạn được bảo mật an toàn</p>
          </div>
        )}

        {/* === STEP 2: PREVIEW === */}
        {step === "preview" && image && (
          <div className="max-w-xs mx-auto animate-in zoom-in-95 duration-300 px-4">
             <div className="relative aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden border border-border shadow-2xl mb-6 bg-muted">
               <img src={image} alt="Preview" className="w-full h-full object-cover" />
               {isLoading && (
                 <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-foreground">
                    <Loader2 className="w-10 h-10 animate-spin mb-3 text-primary" />
                    <p className="font-bold text-sm tracking-widest uppercase animate-pulse">Đang phân tích...</p>
                 </div>
               )}
             </div>
             <div className="grid grid-cols-2 gap-3">
               <button onClick={reset} disabled={isLoading} className="py-3 md:py-4 bg-muted rounded-xl font-bold text-sm hover:bg-accent transition text-muted-foreground cursor-pointer">Quay lại</button>
               <button onClick={analyzeImage} disabled={isLoading} className="py-3 md:py-4 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/25">
                 Phân tích ngay
               </button>
             </div>
          </div>
        )}

        {/* === STEP 3: RESULT DASHBOARD === */}
        {step === "result" && generalAdvice && (
          <div
          ref={resultsRef}
          className="space-y-8 md:space-y-10 animate-in slide-in-from-bottom-8 duration-500">
            
            {/* 1. KEY RESULTS */}
            <section className="space-y-4 md:space-y-6">
                <div className="flex items-baseline justify-between px-1">
                    <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2 text-foreground">
                        <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                        Gợi ý hàng đầu
                    </h2>
                    <button onClick={reset} className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer bg-muted px-2 py-1 rounded-md">
                        <RefreshCcw className="w-3 h-3" /> Làm lại
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-5 md:gap-6">
                    {hairstyles.map((hair, idx) => (
                        // Card Mobile: Flex-col | Desktop: Flex-row
                        <div key={idx} className="bg-card text-card-foreground rounded-2xl md:rounded-3xl border border-border shadow-sm md:shadow-lg overflow-hidden flex flex-col md:flex-row hover:border-primary transition duration-300 group">
                            
                            {/* Image Area */}
                            <div className="bg-muted w-full md:w-1/3 aspect-[4/3] md:aspect-[3/4] relative flex items-center justify-center overflow-hidden">
                                {/* Số thứ tự lớn làm nền */}
                                <span className="text-8xl font-black text-foreground/5 absolute scale-150">0{idx + 1}</span>
                                
                                {/* Nút thử tóc nổi bật trên ảnh ở mobile */}
                                <button 
                                    onClick={() => setSelectedTryOn(hair)}
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary/90 backdrop-blur-sm text-primary-foreground px-5 py-2.5 rounded-full text-xs md:text-sm font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition active:scale-95 cursor-pointer whitespace-nowrap z-10"
                                >
                                    <Wand2 className="w-4 h-4" /> Thử tóc này
                                </button>
                            </div>
                            
                            {/* Content Area */}
                            <div className="p-5 md:p-6 md:w-2/3 flex flex-col justify-between gap-4">
                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-lg md:text-xl font-bold">{hair.name}</h3>
                                        <span className="text-xs font-bold bg-muted px-2 py-1 rounded text-muted-foreground whitespace-nowrap ml-2">
                                            {hair.maintenance} Maintain
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground text-xs md:text-sm font-medium mb-3 italic">{hair.english_name}</p>
                                    
                                    <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3 md:line-clamp-none text-justify">
                                        {hair.why_suitable}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setSelectedHairstyle(hair)}
                                    className="self-start text-sm font-bold text-primary border-b border-primary/20 pb-0.5 hover:text-primary/80 transition flex items-center gap-1 cursor-pointer"
                                >
                                    Xem chi tiết & Hướng dẫn <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <hr className="border-border border-dashed" />

            {/* 2. QUICK ADVICE (Mobile: 1 cột, Desktop: 2 cột) */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card p-5 md:p-6 rounded-2xl md:rounded-3xl border border-border shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Scissors className="w-3 h-3" /> Kỹ thuật cắt
                    </p>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-border border-dashed">
                            <span className="text-sm font-medium text-muted-foreground">Uốn tóc (Perm)?</span>
                            <span className={`text-sm font-bold ${generalAdvice.should_perm.includes("Có") ? 'text-green-600' : 'text-foreground'}`}>
                                {generalAdvice.should_perm.split('.')[0]}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-muted-foreground">Ép side (Down perm)?</span>
                            <span className={`text-sm font-bold ${generalAdvice.should_side_press.includes("Có") ? 'text-green-600' : 'text-foreground'}`}>
                                {generalAdvice.should_side_press.split('.')[0]}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Color Card Dynamic */}
                {(() => {
                    const bgColor = generalAdvice.rpg_color_suggestion || '#000000';
                    const txtClass = getTextColorClass(bgColor);
                    return (
                        <div className="p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-border flex flex-col justify-between gap-4" style={{ backgroundColor: bgColor }}>
                             <div className="flex items-center justify-between">
                                <p className={`text-xs font-bold uppercase tracking-wider opacity-60 ${txtClass}`}>Màu nhuộm gợi ý</p>
                                <div className={`p-1.5 rounded-full bg-white/20 backdrop-blur-sm`}>
                                    <Sparkles className={`w-3 h-3 ${txtClass}`} />
                                </div>
                             </div>
                             <div>
                                <h4 className={`text-xl font-bold leading-tight mb-1 ${txtClass}`}>{generalAdvice.color_suggestion}</h4>
                                <p className={`text-xs opacity-80 ${txtClass}`}>{generalAdvice.dyeing_method}</p>
                             </div>
                        </div>
                    )
                })()}
            </section>

            {/* 3. EXPANDABLE DETAILS */}
            <section className="space-y-3 md:space-y-4">
                {/* Outfit & Accessories Accordion */}
                <div className="border border-border rounded-xl md:rounded-2xl overflow-hidden bg-card shadow-sm">
                    <button onClick={() => toggleSection('style')} className="w-full flex items-center justify-between p-4 md:p-5 bg-card hover:bg-accent transition cursor-pointer">
                        <span className="font-bold text-foreground flex items-center gap-3 text-sm md:text-base">
                            🕶️ Phối đồ & Phụ kiện
                        </span>
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openSection === 'style' ? 'rotate-180' : ''}`} />
                    </button>
                    {openSection === 'style' && (
                        <div className="p-4 md:p-5 border-t border-border bg-muted/30 space-y-5 animate-in slide-in-from-top-2">
                             {/* Outfit */}
                             <div>
                                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Gợi ý trang phục</p>
                                <p className="text-sm text-foreground leading-relaxed bg-background p-3 rounded-xl border border-border">
                                    {generalAdvice.clothing_recommendations}
                                </p>
                             </div>
                             {/* Accessories Grid */}
                             <div>
                                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Phụ kiện đi kèm</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {generalAdvice.accessory && Object.entries(generalAdvice.accessory).map(([key, val]) => (
                                        val && val.length > 2 && (
                                            <div key={key} className="bg-background p-3 rounded-xl border border-border">
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">{key}</p>
                                                <p className="text-sm font-medium text-foreground line-clamp-2">{val}</p>
                                            </div>
                                        )
                                    ))}
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                {/* Skincare & Aftercare Accordion */}
                <div className="border border-border rounded-xl md:rounded-2xl overflow-hidden bg-card shadow-sm">
                    <button onClick={() => toggleSection('care')} className="w-full flex items-center justify-between p-4 md:p-5 bg-card hover:bg-accent transition cursor-pointer">
                        <span className="font-bold text-foreground flex items-center gap-3 text-sm md:text-base">
                            🧴 Chăm sóc & Dưỡng da
                        </span>
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openSection === 'care' ? 'rotate-180' : ''}`} />
                    </button>
                    {openSection === 'care' && (
                        <div className="p-4 md:p-5 border-t border-border bg-muted/30 space-y-5 animate-in slide-in-from-top-2">
                            {/* Face */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
                                <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm mb-2 flex items-center gap-2"><Info className="w-4 h-4"/> Lời khuyên da mặt</h4>
                                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed text-justify">{generalAdvice.propose_face}</p>
                            </div>
                            
                            {/* Do's & Dont's */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="font-bold text-green-700 dark:text-green-400 text-xs uppercase mb-2">Nên làm</p>
                                    <ul className="space-y-2">
                                        {generalAdvice.aftercare_do.map((item, i) => (
                                            <li key={i} className="text-sm text-muted-foreground pl-3 border-l-2 border-green-200 dark:border-green-800">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-bold text-red-700 dark:text-red-400 text-xs uppercase mb-2">Tránh làm</p>
                                    <ul className="space-y-2">
                                        {generalAdvice.aftercare_dont.map((item, i) => (
                                            <li key={i} className="text-sm text-muted-foreground pl-3 border-l-2 border-red-200 dark:border-red-800">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
          </div>
        )}
        </div>
        {/* --- MODALS --- */}
        {showCamera && (
            <div className="fixed inset-0 bg-black z-[100] flex flex-col h-[100dvh]">
                <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover w-full h-full opacity-90" />
                {/* Camera Controls */}
                <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black via-black/50 to-transparent flex items-center justify-center gap-8 md:gap-12 pb-10">
                    <button onClick={stopCamera} className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition"><X /></button>
                    <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition active:scale-95"><div className="w-16 h-16 bg-white rounded-full" /></button>
                    {/* Placeholder for symmetry or switch camera */}
                    <div className="w-14" /> 
                </div>
            </div>
        )}

        {error && (
        <div className="z-[100] fixed top-24 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2 w-[90%] md:w-max max-w-[90vw] justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm truncate">{error}</span>
            </div>
            <button onClick={() => setError(null)}><X className="w-4 h-4 opacity-80" /></button>
        </div>
      )}

        {/* Modal Logic */}
        {selectedHairstyle && (
            <HairstyleDetailModal 
                hairstyle={selectedHairstyle} 
                onClose={() => setSelectedHairstyle(null)} 
            />
        )}
        
        {selectedTryOn && generalAdvice && image && (
          <TryOnModal
            hairstyle={selectedTryOn}
            originalImage={image}
            generalAdvice={generalAdvice}
            onClose={() => setSelectedTryOn(null)}
            analysisId={analysisId} 
          />
        )}

    </main>
  );
}