// app/components/hairstyle/TryOnModal.tsx
"use client";

import { saveGeneratedImage, saveToCollection } from "@/actions/save_try_hair.actions";
import { getUserCredits } from "@/actions/user.actions";
import { GeneralAdvice, Hairstyle } from "@/types/hairstyle";
import { Bookmark, Camera, Check, Coins, Download, Glasses, Image as ImageIcon, Loader2, Palette, RotateCw, Shirt, Sparkles, Wand2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
interface TryOnModalProps {
  hairstyle: Hairstyle;
  originalImage: string;
  generalAdvice: GeneralAdvice;
  onClose: () => void;
  analysisId: string | null;
}

// --- GIỮ NGUYÊN CONSTANTS CẤU HÌNH STYLE ---
const REALISM_BOOSTERS = `
  details: individual hair strands visible, realistic scalp texture, natural hairline transition.
  photography: professional portrait photography, shot on Sony A7R IV, 85mm lens, f/1.8, sharp focus, 8k uhd.
  lighting: studio softbox lighting, cinematic rim light.
`;

const STRICT_NEGATIVE_PROMPT = `
  distorted face, bad anatomy, different person, new identity, plastic surgery look,
  bad eyes, crooked nose, asymmetrical face, bad mouth,
  cartoon, painting, anime, sketch, low quality, blurry, 
  extra limbs, unnatural body structure.
`;

export default function TryOnModal({ hairstyle, originalImage, generalAdvice, onClose, analysisId }: TryOnModalProps) {
  
  const [options, setOptions] = useState({
    applyHair: true,
    applyColor: !!generalAdvice.color_suggestion,
    applyClothing: !!generalAdvice.clothing_recommendations,
    applyAccessories: !!generalAdvice.accessory,
    applyFaceCare: !!generalAdvice.propose_face,
    changeBackground: false,
    changeAngle: false,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
     setMounted(true);
     document.body.style.overflow = "hidden"; // Khóa scroll khi mở
     return () => { 
        document.body.style.overflow = "auto"; // Mở lại khi đóng
     };
  }, []);


  useEffect(() => {
    getUserCredits().then(val => setCredits(val));
  }, []);
  if (!mounted) return null;
  // --- GIỮ NGUYÊN HÀM generatePrompt ---
  const generatePrompt = () => {
    const hairDescription = hairstyle.technical_description 
        ? hairstyle.technical_description 
        : `A ${hairstyle.english_name} hairstyle, highly detailed texture.`;

    let editRequests: string[] = [];

    if (options.changeAngle) {
        editRequests.push(`
            ACTION: Re-imagine the portrait with a slight angle adjustment (best angle) to showcase the hairstyle perfectly.
            CONSTRAINT: The person MUST be sitting in a high-end, classic leather BARBER CHAIR in a barber shop setting.
            HAIRSTYLE: "${hairDescription}" with voluminous and realistic texture.
        `);
    } else {
        editRequests.push(`
            ACTION: Inpaint/Replace hair ONLY.
            CONSTRAINT: Keep the EXACT original head pose and camera angle.
            HAIRSTYLE: "${hairDescription}".
        `);
    }

    if (options.changeBackground) {
      editRequests.push(`BACKGROUND: Change background to a blurred barber shop.`);
    } else {
        editRequests.push(`BACKGROUND: Keep the ORIGINAL background 100% unchanged.`);
    }

    if (options.applyColor && generalAdvice.color_suggestion) {
      editRequests.push(`Hair color: ${generalAdvice.color_suggestion} with natural shine.`);
    }

    if (options.applyClothing && generalAdvice.clothing_recommendations) {
      editRequests.push(`Clothing: ${generalAdvice.clothing_recommendations}.`);
    }

    if (options.applyAccessories && generalAdvice.accessory) {
      const accessoriesList = Object.entries(generalAdvice.accessory)
        .map(([_, value]) => value).filter(v => v && v.length > 2).join(", ");
      if (accessoriesList) editRequests.push(`Accessories: Wearing ${accessoriesList}.`);
    }

    if (options.applyFaceCare) {
      editRequests.push(`Skin: Flawless, smooth skin texture, natural pores.`);
    }

    const fullPrompt = `
      [TASK: PORTRAIT GENERATION]
      
      1. IDENTITY PRESERVATION (CRITICAL):
      - The facial features (Eyes, Nose, Mouth) MUST be EXACTLY the same as the input photo.
      - The person must be instantly recognizable.
      
      2. INSTRUCTIONS:
      ${editRequests.join(" ")}
      
      3. QUALITY:
      ${REALISM_BOOSTERS}
      
      4. NEGATIVE PROMPT:
      ${STRICT_NEGATIVE_PROMPT}
    `.trim();

    return fullPrompt;
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    if (credits !== null && credits < 1) {
        alert("Hết lượt tạo ảnh!");
        return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setIsSaved(false);

    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: originalImage, 
          prompt: generatePrompt(), 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi tạo ảnh");

      if (data.editedImage) {
        setGeneratedImage(data.editedImage);
        if (typeof data.remainingCredits === 'number') setCredits(data.remainingCredits);

        if (analysisId) {
            const techDesc = hairstyle.technical_description || `A ${hairstyle.english_name} hairstyle`;
            saveGeneratedImage(analysisId, hairstyle.name, data.editedImage, techDesc)
              .then(res => console.log("Auto saved generated history", res))
              .catch(err => console.error("Auto save failed", err));
        }
      } 
    } catch (err: any) {
      console.error(err);
      alert("Lỗi khi tạo ảnh. Thử lại sau!");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `barber_ai_${Date.now()}.png`; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSaveCollection = async () => {
    if (!generatedImage || isSaved) return;
    setIsSaving(true);
    
    try {
        const techDesc = hairstyle.technical_description || `A ${hairstyle.english_name} hairstyle`;
        const res = await saveToCollection(
            hairstyle.name, 
            hairstyle.english_name, 
            generatedImage, 
            techDesc
        );

        if (res.success) {
            setIsSaved(true);
            alert("Đã lưu vào bộ sưu tập!");
        } else {
            alert(res.error || "Lỗi khi lưu.");
        }
    } catch (error) {
        console.error(error);
        alert("Có lỗi xảy ra.");
    } finally {
        setIsSaving(false);
    }
  };

  return createPortal(
    // Mobile: items-end (bottom sheet) | Desktop: items-center
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-end md:items-center justify-center sm:p-4" onClick={onClose}>
      
      {/* Container: Max height dynamic cho mobile, bo góc trên */}
      <div 
        className="bg-card rounded-t-[2rem] md:rounded-3xl w-full max-w-xl lg:max-w-2xl max-h-[90dvh] md:max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-border flex justify-between items-center bg-card sticky top-0 z-10 rounded-t-[2rem] md:rounded-t-3xl">
          <div>
            <h3 className="text-base md:text-xl font-bold text-card-foreground line-clamp-1">Thử: {hairstyle.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5 md:mt-1">
                <Coins className="w-3.5 h-3.5 text-yellow-600" />
                <span className="text-xs font-bold text-muted-foreground">
                    {credits === null ? '...' : `${credits} lượt còn lại`}
                </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 hover:bg-accent rounded-full transition-colors cursor-pointer">
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5 md:space-y-6 scrollbar-hide">
          {generatedImage ? (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-border bg-secondary aspect-[3/4] md:aspect-square max-h-[50vh] mx-auto">
                <img src={generatedImage} alt="AI generated" className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-md">AI Generated</div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setGeneratedImage(null)} className="w-full py-3 text-sm font-bold text-muted-foreground border border-border rounded-xl hover:bg-accent transition cursor-pointer">Thử lại</button>
                <button onClick={handleDownload} className="w-full py-3 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition flex items-center justify-center gap-2 cursor-pointer"><Download className="w-4 h-4" /> Tải về</button>
                <button 
                    onClick={handleSaveCollection} 
                    disabled={isSaving || isSaved}
                    className={`col-span-2 py-3 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border
                        ${isSaved 
                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800' 
                            : 'bg-card text-blue-600 border-blue-200 hover:bg-blue-50 dark:bg-card dark:text-blue-400 dark:border-blue-800 dark:hover:bg-accent'
                        }
                    `}
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : isSaved ? <Check className="w-4 h-4"/> : <Bookmark className="w-4 h-4"/>}
                    {isSaved ? "Đã lưu vào BST" : "Lưu kiểu tóc này"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
               {/* Preview ảnh gốc */}
               <div className="flex items-center gap-4 p-3 bg-secondary rounded-xl border border-border">
                  <img src={originalImage} alt="Original" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="text-xs text-muted-foreground">
                    <p>Dùng ảnh gốc.</p>
                    <p className="text-blue-600 font-medium">Phí: 1 Lượt / lần</p>
                  </div>
               </div>

              <div className="space-y-2">
                {/* 1. SECTION: CƠ BẢN */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-transparent hover:bg-accent transition cursor-pointer select-none">
                  <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.applyHair ? 'bg-primary border-primary' : 'border-border'}`}>
                    {options.applyHair && <Sparkles className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-sm text-foreground block">Kiểu tóc mới</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">{hairstyle.name}</span>
                  </div>
                </label>

                {/* 2. SECTION: NÂNG CAO */}
                <div className="pt-2 pb-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">Tùy chọn nâng cao</div>
                
                <label className="flex items-start gap-3 p-3 rounded-xl border border-border has-[:checked]:border-primary has-[:checked]:bg-secondary transition cursor-pointer select-none">
                    <input type="checkbox" checked={options.changeBackground} onChange={e => setOptions(p => ({ ...p, changeBackground: e.target.checked }))} className="hidden" />
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.changeBackground ? 'bg-primary border-primary' : 'border-border'}`}>
                        <ImageIcon className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-foreground block">Thay nền Studio</span>
                      <span className="text-xs text-muted-foreground">Chuyển sang nền tiệm tóc (Bokeh)</span>
                    </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-border has-[:checked]:border-primary has-[:checked]:bg-secondary transition cursor-pointer select-none">
                    <input type="checkbox" checked={options.changeAngle} onChange={e => setOptions(p => ({ ...p, changeAngle: e.target.checked }))} className="hidden" />
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.changeAngle ? 'bg-primary border-primary' : 'border-border'}`}>
                        <RotateCw className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-foreground block">AI chọn góc đẹp</span>
                      <span className="text-xs text-muted-foreground">Tự xoay góc mặt (Giảm giống thật)</span>
                    </div>
                </label>

                {/* 3. SECTION: GỢI Ý */}
                <div className="pt-2 pb-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">Gợi ý chuyên gia</div>

                {generalAdvice.color_suggestion && (
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-border has-[:checked]:border-primary has-[:checked]:bg-secondary transition cursor-pointer select-none">
                    <input type="checkbox" checked={options.applyColor} onChange={e => setOptions(p => ({ ...p, applyColor: e.target.checked }))} className="hidden" />
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.applyColor ? 'bg-primary border-primary' : 'border-border'}`}>
                        <Palette className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-foreground block">Màu nhuộm</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">{generalAdvice.color_suggestion}</span>
                    </div>
                  </label>
                )}

                {generalAdvice.clothing_recommendations && (
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-border has-[:checked]:border-primary has-[:checked]:bg-secondary transition cursor-pointer select-none">
                    <input type="checkbox" checked={options.applyClothing} onChange={e => setOptions(p => ({ ...p, applyClothing: e.target.checked }))} className="hidden" />
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.applyClothing ? 'bg-primary border-primary' : 'border-border'}`}>
                        <Shirt className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-foreground block">Trang phục</span>
                      <span className="text-xs text-muted-foreground line-clamp-2">{generalAdvice.clothing_recommendations}</span>
                    </div>
                  </label>
                )}

                {(generalAdvice.accessory || generalAdvice.propose_face) && (
                   <div className="grid grid-cols-2 gap-2">
                     {generalAdvice.accessory && (
                        <label className="flex items-center gap-2 p-3 rounded-xl border border-border has-[:checked]:border-primary has-[:checked]:bg-secondary transition cursor-pointer select-none">
                            <input type="checkbox" checked={options.applyAccessories} onChange={e => setOptions(p => ({ ...p, applyAccessories: e.target.checked }))} className="hidden" />
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${options.applyAccessories ? 'bg-primary border-primary' : 'border-border'}`}>
                                <Glasses className="w-2.5 h-2.5 text-primary-foreground" />
                            </div>
                            <span className="text-xs font-bold text-foreground">Phụ kiện</span>
                        </label>
                     )}
                     
                     {generalAdvice.propose_face && (
                        <label className="flex items-center gap-2 p-3 rounded-xl border border-border has-[:checked]:border-primary has-[:checked]:bg-secondary transition cursor-pointer select-none">
                            <input type="checkbox" checked={options.applyFaceCare} onChange={e => setOptions(p => ({ ...p, applyFaceCare: e.target.checked }))} className="hidden" />
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${options.applyFaceCare ? 'bg-primary border-primary' : 'border-border'}`}>
                                <Camera className="w-2.5 h-2.5 text-primary-foreground" />
                            </div>
                            <span className="text-xs font-bold text-foreground">Làm đẹp da</span>
                        </label>
                     )}
                   </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions - Sticky Bottom on Mobile */}
        {!generatedImage && (
          <div className="p-4 md:p-5 border-t border-border bg-card md:rounded-b-3xl safe-area-bottom">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (credits !== null && credits < 1)}
              className={`w-full py-3.5 md:py-4 rounded-xl font-bold text-base transition flex items-center justify-center gap-2 shadow-lg dark:shadow-neutral-900/50 cursor-pointer
                ${(credits !== null && credits < 1) 
                    ? 'bg-secondary text-muted-foreground cursor-not-allowed' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }
              `}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý (30s)...
                </>
              ) : (credits !== null && credits < 1) ? (
                <>Hết lượt dùng</>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Tạo ảnh (-1 Credit)
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>,document.body
  );
}