"use client";

import { saveAnalysisResult } from "@/actions/save_try_hair.actions";
import HairstyleDetailModal from "@/components/hairstyle/HairstyleCard"; // Đảm bảo component này render modal chi tiết
import TryOnModal from "@/components/hairstyle/TryOnModal";
import { createClient } from "@/lib/supabase/client"; // Supabase Client
import type { GeneralAdvice, Hairstyle } from "@/types/hairstyle";
import { AlertCircle, Camera, ChevronDown, ChevronRight, Info, Loader2, RefreshCcw, Scissors, Sparkles, Upload, Wand2, X } from "lucide-react";
import { useRef, useState } from "react";
// --- Utility Functions ---
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
  // State quản lý Modals
  const [selectedHairstyle, setSelectedHairstyle] = useState<Hairstyle | null>(null); // Để xem chi tiết text
  const [selectedTryOn, setSelectedTryOn] = useState<Hairstyle | null>(null); // Để mở modal AI Generate

  const [analysisId, setAnalysisId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null); // Quản lý đóng mở các mục phụ (accessories, clothes...)

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- Logic Handlers (Giữ nguyên logic cũ của bạn) ---
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
    } catch { setError("Không bật được camera :("); }
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

      // (Tuỳ chọn) Bắt buộc đăng nhập mới được dùng
      if (!token) {
        throw new Error("Vui lòng đăng nhập để sử dụng tính năng này!");
      }
      const res = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
          
         },
        body: JSON.stringify({ imageBase64: image.split(",")[1] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi server");
      
      setGeneralAdvice(data.general_advice);
      setHairstyles(data.hairstyles || []);
      // 2. [MỚI] Lưu kết quả phân tích vào Database (Chạy ngầm không cần await UI)
      saveAnalysisResult(image, data).then(result => {
          if (result.success && result.analysisId) {
              setAnalysisId(result.analysisId);
              console.log("Analysis Saved:", result.analysisId);
          }
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
    <main className="min-h-screen bg-white text-neutral-900 font-sans pb-20">
      
      {/* 1. Header Minimal */}
      <header className="py-6 md:py-10 text-center sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-neutral-100">
        <h1 className="text-2xl md:text-3xl font-black tracking-tighter cursor-pointer" onClick={reset}>
          AI BARBER<span className="text-neutral-300">.</span>
        </h1>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-8">
        
        {/* === STEP 1: UPLOAD === */}
        {step === "upload" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
            <div className="mb-8">
               <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-neutral-100">
                 <Scissors className="w-10 h-10 text-neutral-800" />
               </div>
               <h2 className="text-3xl md:text-4xl font-bold mb-3 text-neutral-900">Tư vấn kiểu tóc</h2>
               <p className="text-neutral-500 text-base md:text-lg">Phân tích khuôn mặt & Gợi ý kiểu tóc phù hợp nhất</p>
            </div>
               
            <div className="flex flex-col gap-4 max-w-sm mx-auto ">
                <button onClick={startCamera} className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-black text-white font-bold text-lg hover:bg-neutral-800 transition shadow-xl shadow-neutral-200 cursor-pointer">
                   <Camera className="w-6 h-6" /> Chụp ảnh
                </button>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-neutral-200"></span></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-neutral-400">Hoặc</span></div>
                </div>
                <label className="flex items-center justify-center gap-3 p-5 rounded-2xl border border-neutral-200 bg-white text-neutral-900 font-bold text-lg hover:bg-neutral-50 transition cursor-pointer">
                   <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
                   <Upload className="w-6 h-6" /> Tải ảnh lên
                </label>
            </div>
            <p className="mt-6 text-xs text-neutral-400">Dữ liệu của bạn được bảo mật an toàn</p>
          </div>
        )}

        {/* === STEP 2: PREVIEW === */}
        {step === "preview" && image && (
          <div className="max-w-xs mx-auto animate-in zoom-in-95 duration-300">
             <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-neutral-200 shadow-2xl mb-6 bg-neutral-100">
               <img src={image} alt="Preview" className="w-full h-full object-cover" />
               {isLoading && (
                 <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center z-10 text-white">
                    <Loader2 className="w-10 h-10 animate-spin mb-3" />
                    <p className="font-bold text-sm tracking-widest uppercase">Đang phân tích...</p>
                 </div>
               )}
             </div>
             <div className="grid grid-cols-2 gap-3">
               <button onClick={reset} disabled={isLoading} className="py-3 bg-neutral-100 rounded-xl font-bold text-sm hover:bg-neutral-200 transition">Quay lại</button>
               <button onClick={analyzeImage} disabled={isLoading} className="py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition flex items-center justify-center gap-2">
                 Phân tích
               </button>
             </div>
          </div>
        )}

        {/* === STEP 3: RESULT DASHBOARD === */}
        {step === "result" && generalAdvice && (
          <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
            
            {/* 1. KEY RESULTS (Nổi bật nhất) */}
            <section className="space-y-6">
                <div className="flex items-baseline justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        Gợi ý hàng đầu
                    </h2>
                    <button onClick={reset} className="text-xs font-bold text-neutral-400 hover:text-black flex items-center gap-1 cursor-pointer">
                        <RefreshCcw className="w-3 h-3" /> Làm lại
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {hairstyles.map((hair, idx) => (
                        <div key={idx} className="bg-white rounded-3xl border border-neutral-100 shadow-lg overflow-hidden flex flex-col md:flex-row hover:border-black transition duration-300 group">
                            <div className="bg-neutral-100 md:w-1/3 aspect-video md:aspect-[3/4] relative flex items-center justify-center">
                                <span className="text-8xl font-black text-neutral-200 opacity-50 absolute">0{idx + 1}</span>
                                <button 
                                    onClick={() => setSelectedTryOn(hair)}
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition active:scale-95 cursor-pointer"
                                >
                                    <Wand2 className="w-4 h-4" /> Thử kiểu tóc
                                </button>
                            </div>
                            
                            <div className="p-6 md:w-2/3 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xl font-bold mb-1">{hair.name}</h3>
                                    <p className="text-neutral-500 text-sm font-medium mb-3 italic">{hair.english_name}</p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className="px-2 py-1 bg-neutral-50 border border-neutral-200 text-[10px] font-bold uppercase rounded text-neutral-500">
                                            {hair.maintenance} Maintain
                                        </span>
                                    </div>
                                    <p className="text-neutral-600 text-sm leading-relaxed mb-4 line-clamp-3">
                                        {hair.why_suitable}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setSelectedHairstyle(hair)}
                                    className="self-start text-sm font-bold text-neutral-900 border-b border-black pb-0.5 hover:opacity-70 transition flex items-center gap-1  cursor-pointer"
                                >
                                    Xem chi tiết & Hướng dẫn <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <hr className="border-neutral-100" />

            {/* 2. QUICK ADVICE (Màu & Xử lý tóc) */}
            <section className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1 bg-neutral-50 p-6 rounded-3xl border border-neutral-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Lời khuyên kỹ thuật</p>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                            <span className="text-sm font-medium text-neutral-600">Uốn tóc?</span>
                            <span className={`text-sm font-bold ${generalAdvice.should_perm.includes("Có") ? 'text-green-600' : 'text-neutral-900'}`}>
                                {generalAdvice.should_perm.split('.')[0]}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-neutral-600">Ép side?</span>
                            <span className={`text-sm font-bold ${generalAdvice.should_side_press.includes("Có") ? 'text-green-600' : 'text-neutral-900'}`}>
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
                        <div className="col-span-2 md:col-span-1 p-6 rounded-3xl shadow-sm border border-neutral-100 flex flex-col justify-between" style={{ backgroundColor: bgColor }}>
                             <p className={`text-xs font-bold uppercase tracking-wider opacity-60 mb-2 ${txtClass}`}>Màu nhuộm gợi ý</p>
                             <div>
                                <h4 className={`text-xl font-bold leading-tight mb-1 ${txtClass}`}>{generalAdvice.color_suggestion}</h4>
                                <p className={`text-xs opacity-80 ${txtClass}`}>{generalAdvice.dyeing_method}</p>
                             </div>
                        </div>
                    )
                })()}
            </section>

            {/* 3. EXPANDABLE DETAILS (Thông tin phụ để tránh loạn mắt) */}
            <section className="space-y-4">
                {/* Outfit & Accessories Accordion */}
                <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                    <button onClick={() => toggleSection('style')} className="w-full flex items-center justify-between p-5 bg-white hover:bg-neutral-50 transition cursor-pointer">
                        <span className="font-bold text-neutral-900 flex items-center gap-3">
                            🕶️ Phối đồ & Phụ kiện
                        </span>
                        <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${openSection === 'style' ? 'rotate-180' : ''}`} />
                    </button>
                    {openSection === 'style' && (
                        <div className="p-5 border-t border-neutral-100 bg-neutral-50 space-y-6 animate-in slide-in-from-top-2">
                             {/* Outfit */}
                             <div>
                                <p className="text-xs font-bold uppercase text-neutral-400 mb-2">Trang phục</p>
                                <p className="text-sm text-neutral-700 leading-relaxed bg-white p-3 rounded-xl border border-neutral-200">
                                    {generalAdvice.clothing_recommendations}
                                </p>
                             </div>
                             {/* Accessories Grid */}
                             <div>
                                <p className="text-xs font-bold uppercase text-neutral-400 mb-3">Phụ kiện đề xuất</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {generalAdvice.accessory && Object.entries(generalAdvice.accessory).map(([key, val]) => (
                                        val && val.length > 2 && (
                                            <div key={key} className="bg-white p-3 rounded-xl border border-neutral-200">
                                                <p className="text-[10px] text-neutral-400 uppercase font-bold mb-1">{key}</p>
                                                <p className="text-sm font-medium text-neutral-900">{val}</p>
                                            </div>
                                        )
                                    ))}
                                </div>
                             </div>
                        </div>
                    )}
                </div>

                {/* Skincare & Aftercare Accordion */}
                <div className="border border-neutral-200 rounded-2xl overflow-hidden ">
                    <button onClick={() => toggleSection('care')} className="w-full flex items-center justify-between p-5 bg-white hover:bg-neutral-50 transition cursor-pointer">
                        <span className="font-bold text-neutral-900 flex items-center gap-3">
                            🧴 Chăm sóc & Dưỡng da
                        </span>
                        <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${openSection === 'care' ? 'rotate-180' : ''}`} />
                    </button>
                    {openSection === 'care' && (
                        <div className="p-5 border-t border-neutral-100 bg-neutral-50 space-y-6 animate-in slide-in-from-top-2">
                            {/* Face */}
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2"><Info className="w-4 h-4"/> Lời khuyên da mặt</h4>
                                <p className="text-sm text-blue-800 leading-relaxed">{generalAdvice.propose_face}</p>
                            </div>
                            
                            {/* Do's & Dont's */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p className="font-bold text-green-700 text-xs uppercase mb-2">Nên làm</p>
                                    <ul className="space-y-2">
                                        {generalAdvice.aftercare_do.map((item, i) => (
                                            <li key={i} className="text-sm text-neutral-600 pl-3 border-l-2 border-green-200">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-bold text-red-700 text-xs uppercase mb-2">Tránh làm</p>
                                    <ul className="space-y-2">
                                        {generalAdvice.aftercare_dont.map((item, i) => (
                                            <li key={i} className="text-sm text-neutral-600 pl-3 border-l-2 border-red-200">{item}</li>
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

        {/* --- MODALS --- */}
        {showCamera && (
            <div className="fixed inset-0 bg-black z-[100] flex flex-col">
                <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover w-full opacity-90" />
                <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black to-transparent flex items-center justify-center gap-12 pb-8">
                    <button onClick={stopCamera} className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 backdrop-blur transition"><X /></button>
                    <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition active:scale-95"><div className="w-16 h-16 bg-white rounded-full" /></button>
                </div>
            </div>
        )}

        {error && (
        <div className="z-[100] fixed top-24 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-2 w-max max-w-[90vw]">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">{error}</span>
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

      </div>
    </main>
  );
}