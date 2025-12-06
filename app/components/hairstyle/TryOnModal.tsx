"use client";

import { saveGeneratedImage, saveToCollection } from "@/actions/save_try_hair.actions"; // Import Action
import { getUserCredits } from "@/actions/user.actions";
import { GeneralAdvice, Hairstyle } from "@/types/hairstyle";
import { Bookmark, Camera, Check, Coins, Download, Glasses, Image as ImageIcon, Loader2, Palette, RotateCw, Shirt, Sparkles, Wand2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface TryOnModalProps {
  hairstyle: Hairstyle;
  originalImage: string;
  generalAdvice: GeneralAdvice;
  
  onClose: () => void;
  analysisId: string | null;
}

// --- CẤU HÌNH STYLE ---
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

export default function TryOnModal({ hairstyle, originalImage, generalAdvice, onClose ,analysisId}: TryOnModalProps) {
  
  const [options, setOptions] = useState({
    applyHair: true,
    applyColor: !!generalAdvice.color_suggestion,
    applyClothing: !!generalAdvice.clothing_recommendations,
    applyAccessories: !!generalAdvice.accessory,
    applyFaceCare: !!generalAdvice.propose_face,
    // [MỚI] Tùy chọn nâng cao
    changeBackground: false, // Mặc định tắt để giữ nền gốc
    changeAngle: false,      // Mặc định tắt để giữ góc gốc
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  useEffect(() => {
    getUserCredits().then(val => setCredits(val));
  }, []);

  // --- HÀM TẠO PROMPT THÔNG MINH ---
  const generatePrompt = () => {
    const hairDescription = hairstyle.technical_description 
        ? hairstyle.technical_description 
        : `A ${hairstyle.english_name} hairstyle, highly detailed texture.`;

    let editRequests: string[] = [];

    // 1. Logic Thay Tóc & Góc Độ
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

    // 2. Logic Thay Nền
    if (options.changeBackground) {
      editRequests.push(`BACKGROUND: Change background to a blurred barber shop.`);
    } else {
        editRequests.push(`BACKGROUND: Keep the ORIGINAL background 100% unchanged.`);
    }

    // 3. Các tùy chọn khác
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

    // 4. TỔ HỢP SUPER PROMPT
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

    console.log("Super Prompt:", fullPrompt); 
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
    setIsSaved(false); // Reset trạng thái lưu

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

        // [MỚI] Tự động lưu lịch sử tạo ảnh (GeneratedStyle) vào DB
        // Việc này chạy ngầm, không chặn UI
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
// [MỚI] HÀM LƯU VÀO BỘ SƯU TẬP
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
  return (
    <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      {/* 👈 THAY ĐỔI Ở ĐÂY */}
      <div className="bg-white rounded-3xl w-full **max-w-xl lg:max-w-2xl** max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-neutral-900 line-clamp-1">Thử: {hairstyle.name}</h3>
            <div className="flex items-center gap-1.5 mt-1">
                <Coins className="w-3.5 h-3.5 text-yellow-600" />
                <span className="text-xs font-bold text-neutral-600">
                    {credits === null ? '...' : `${credits} lượt còn lại`}
                </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {generatedImage ? (
            <div className="space-y-4 animate-in fade-in duration-500">
              {/* 👈 THAY ĐỔI Ở ĐÂY */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-neutral-200 bg-neutral-50 **aspect-square md:aspect-[3/4]**">
                <img src={generatedImage} alt="AI generated" className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-md">AI Generated</div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setGeneratedImage(null)} className="w-full py-3 text-sm font-bold text-neutral-600 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition cursor-pointer">Thử lại</button>
                <button onClick={handleDownload} className="w-full py-3 text-sm font-bold bg-black text-white rounded-xl hover:bg-neutral-800 transition flex items-center justify-center gap-2 cursor-pointer"><Download className="w-4 h-4" /> Tải ảnh về</button>
              {/* [MỚI] Nút Lưu bộ sưu tập */}
                <button 
                    onClick={handleSaveCollection} 
                    disabled={isSaving || isSaved}
                    className={`col-span-2 py-3 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border
                        ${isSaved 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
                        }
                    `}
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : isSaved ? <Check className="w-4 h-4"/> : <Bookmark className="w-4 h-4"/>}
                    {isSaved ? "Đã lưu vào bộ sưu tập" : "Lưu kiểu tóc này"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
               {/* Preview ảnh gốc */}
               <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                  <img src={originalImage} alt="Original" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="text-xs text-neutral-500">
                    <p>Dùng ảnh gốc.</p>
                    <p className="text-blue-600 font-medium">Chi phí: 1 Lượt / lần tạo</p>
                  </div>
               </div>

              <div className="space-y-3">
                {/* 1. SECTION: CƠ BẢN (TÓC) */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-transparent hover:bg-neutral-50 transition cursor-pointer select-none">
                  <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.applyHair ? 'bg-black border-black' : 'border-neutral-300'}`}>
                    {options.applyHair && <Sparkles className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-sm text-neutral-900 block">Kiểu tóc mới</span>
                    <span className="text-xs text-neutral-500 line-clamp-1">{hairstyle.name}</span>
                  </div>
                </label>

                {/* 2. SECTION: NÂNG CAO (MỚI THÊM) */}
                <div className="pt-2 pb-1 text-xs font-bold text-neutral-400 uppercase tracking-wider">Tùy chọn nâng cao</div>
                
                {/* Change Background Toggle */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 has-[:checked]:border-black has-[:checked]:bg-neutral-50 transition cursor-pointer select-none">
                    <input type="checkbox" checked={options.changeBackground} onChange={e => setOptions(p => ({ ...p, changeBackground: e.target.checked }))} className="hidden" />
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.changeBackground ? 'bg-black border-black' : 'border-neutral-300'}`}>
                        <ImageIcon className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-neutral-900 block">Thay nền Studio</span>
                      <span className="text-xs text-neutral-500">Chuyển sang nền tiệm tóc mờ ảo (Bokeh)</span>
                    </div>
                </label>

                {/* Change Angle Toggle */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 has-[:checked]:border-black has-[:checked]:bg-neutral-50 transition cursor-pointer select-none">
                    <input type="checkbox" checked={options.changeAngle} onChange={e => setOptions(p => ({ ...p, changeAngle: e.target.checked }))} className="hidden" />
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.changeAngle ? 'bg-black border-black' : 'border-neutral-300'}`}>
                        <RotateCw className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-neutral-900 block">Tự động chọn góc đẹp</span>
                      <span className="text-xs text-neutral-500">AI tự xoay góc mặt để tóc đẹp nhất (có thể giảm giống thật)</span>
                    </div>
                </label>

                {/* 3. SECTION: CHI TIẾT (TỪ GEMINI) */}
                <div className="pt-2 pb-1 text-xs font-bold text-neutral-400 uppercase tracking-wider">Gợi ý từ chuyên gia</div>

                {generalAdvice.color_suggestion && (
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 has-[:checked]:border-black has-[:checked]:bg-neutral-50 transition cursor-pointer select-none">
                    <input type="checkbox" checked={options.applyColor} onChange={e => setOptions(p => ({ ...p, applyColor: e.target.checked }))} className="hidden" />
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.applyColor ? 'bg-black border-black' : 'border-neutral-300'}`}>
                        <Palette className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-neutral-900 block">Áp dụng màu nhuộm</span>
                      <span className="text-xs text-neutral-500 line-clamp-1">{generalAdvice.color_suggestion}</span>
                    </div>
                  </label>
                )}

                {generalAdvice.clothing_recommendations && (
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 has-[:checked]:border-black has-[:checked]:bg-neutral-50 transition cursor-pointer select-none">
                    <input type="checkbox" checked={options.applyClothing} onChange={e => setOptions(p => ({ ...p, applyClothing: e.target.checked }))} className="hidden" />
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.applyClothing ? 'bg-black border-black' : 'border-neutral-300'}`}>
                        <Shirt className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-neutral-900 block">Thay đổi trang phục</span>
                      <span className="text-xs text-neutral-500 line-clamp-2">{generalAdvice.clothing_recommendations}</span>
                    </div>
                  </label>
                )}

                {generalAdvice.accessory && (
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 has-[:checked]:border-black has-[:checked]:bg-neutral-50 transition cursor-pointer select-none">
                    <input type="checkbox" checked={options.applyAccessories} onChange={e => setOptions(p => ({ ...p, applyAccessories: e.target.checked }))} className="hidden" />
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.applyAccessories ? 'bg-black border-black' : 'border-neutral-300'}`}>
                        <Glasses className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-neutral-900 block">Thêm phụ kiện</span>
                      <span className="text-xs text-neutral-500">Tự động chọn phụ kiện hợp khuôn mặt</span>
                    </div>
                  </label>
                )}
                
                 {generalAdvice.propose_face && (
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 has-[:checked]:border-black has-[:checked]:bg-neutral-50 transition cursor-pointer select-none">
                    <input type="checkbox" checked={options.applyFaceCare} onChange={e => setOptions(p => ({ ...p, applyFaceCare: e.target.checked }))} className="hidden" />
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.applyFaceCare ? 'bg-black border-black' : 'border-neutral-300'}`}>
                        <Camera className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-neutral-900 block">Skin Retouch</span>
                      <span className="text-xs text-neutral-500">Làm mịn da, giữ nét tự nhiên</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!generatedImage && (
          <div className="p-5 border-t border-neutral-100 bg-white">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (credits !== null && credits < 1)}
              className={`w-full py-4 rounded-xl font-bold text-base transition flex items-center justify-center gap-2 shadow-lg shadow-neutral-200 cursor-pointer
                ${(credits !== null && credits < 1) 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-black text-white hover:bg-neutral-800'
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
                  Tạo ảnh ngay (-1 Lượt)
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}