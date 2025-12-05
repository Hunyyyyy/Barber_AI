"use client";

import { GeneralAdvice, Hairstyle } from "@/types/hairstyle";
import { Download, Glasses, Loader2, Palette, Shirt, Sparkles, Wand2, X } from "lucide-react"; // Đã thêm Download
import { useState } from "react";

interface TryOnModalProps {
  hairstyle: Hairstyle;
  originalImage: string;
  generalAdvice: GeneralAdvice;
  onClose: () => void;
}

export default function TryOnModal({ hairstyle, originalImage, generalAdvice, onClose }: TryOnModalProps) {
  
  // State giữ nguyên
  const [options, setOptions] = useState({
    applyHair: true,
    applyColor: !!generalAdvice.color_suggestion,
    applyClothing: !!generalAdvice.clothing_recommendations,
    applyAccessories: !!generalAdvice.accessory,
    applyFaceCare: !!generalAdvice.propose_face,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // --- HÀM TẠO PROMPT (Giữ nguyên) ---
  const generatePrompt = () => {
    let prompt = `Thay đổi kiểu tóc của người trong ảnh thành kiểu "${hairstyle.name}". Mô tả kiểu tóc: ${hairstyle.how_to_style}. `;
    if (options.applyColor && generalAdvice.color_suggestion) {
      prompt += `Nhuộm tóc màu ${generalAdvice.color_suggestion} (${generalAdvice.dyeing_method || "tự nhiên"}). `;
    }
    if (options.applyClothing && generalAdvice.clothing_recommendations) {
      prompt += `Thay đổi trang phục phần thân trên thành: ${generalAdvice.clothing_recommendations}. `;
    }
    if (options.applyAccessories && generalAdvice.accessory) {
      const accessoriesList = Object.entries(generalAdvice.accessory)
        .map(([_, value]) => value)
        .filter((val) => val && val.length > 2)
        .join(", ");
      
      if (accessoriesList) {
        prompt += `Thêm phụ kiện phù hợp: ${accessoriesList}. `;
      }
    }
    if (options.applyFaceCare) {
      prompt += `Cải thiện làn da mặt mịn màng, sáng hơn (giữ nguyên các nét khuôn mặt). `;
    }
    prompt += `QUAN TRỌNG: Giữ nguyên khuôn mặt gốc, biểu cảm và bối cảnh (background). Chỉ thay đổi tóc và các yếu tố được yêu cầu. Ảnh chất lượng cao, thực tế (photorealistic), chuẩn 4k.`;
    return prompt.trim();
  };

  // --- HÀM TẠO ẢNH (Giữ nguyên) ---
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedImage(null);
    try {
      const res = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Lưu ý: Base64 ảnh gốc sẽ được gửi đi
          imageBase64: originalImage, 
          prompt: generatePrompt(),
        }),
      });
      const data = await res.json();
      if (data.editedImage) {
        setGeneratedImage(data.editedImage);
      } else {
        throw new Error("Không nhận được ảnh trả về");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tạo ảnh. Vui lòng thử lại!");
    } finally {
      setIsGenerating(false);
    }
  };
  
  // --- HÀM TẢI ẢNH VỀ (Mới) ---
  const handleDownload = () => {
    if (generatedImage) {
      // Tạo một thẻ <a> tạm thời
      const link = document.createElement('a');
      link.href = generatedImage; // Base64 Data URL
      // Đặt tên file, sử dụng tên kiểu tóc để dễ nhận biết
      link.download = `aibarber_${hairstyle.english_name.replace(/\s/g, '-')}_${Date.now()}.png`; 
      
      // Thêm vào body, click, và xóa đi
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-neutral-900 line-clamp-1">Thử: {hairstyle.name}</h3>
            <p className="text-xs text-neutral-500">Chọn các yếu tố muốn áp dụng</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Ảnh kết quả */}
          {generatedImage ? (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-neutral-200 bg-neutral-50 aspect-[3/4]">
                <img src={generatedImage} alt="AI generated" className="w-full h-full object-cover" />
                <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-md">
                  AI Generated
                </div>
              </div>
              
              {/* Nút Tải về và Thử lại (Mới) */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => setGeneratedImage(null)} 
                    className="w-full py-3 text-sm font-bold text-neutral-600 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition cursor-pointer"
                >
                    Thử lại
                </button>
                <button 
                    onClick={handleDownload}
                    className="w-full py-3 text-sm font-bold bg-black text-white rounded-xl hover:bg-neutral-800 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                    <Download className="w-4 h-4" /> Tải ảnh về
                </button>
              </div>
            </div>
          ) : (
            /* Form Tùy chọn */
            <div className="space-y-4">
               {/* Preview ảnh gốc nhỏ */}
               <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                  <img src={originalImage} alt="Original" className="w-12 h-12 rounded-lg object-cover" />
                  <div className="text-xs text-neutral-500">
                    <p>Đang dùng ảnh gốc của bạn.</p>
                    <p>AI sẽ giữ nguyên khuôn mặt.</p>
                  </div>
               </div>

              <div className="space-y-3">
                {/* Checkbox items (Giữ nguyên) */}
                <label className="flex items-start gap-3 p-3 rounded-xl border border-transparent hover:bg-neutral-50 transition cursor-pointer select-none">
                  <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.applyHair ? 'bg-black border-black' : 'border-neutral-300'}`}>
                    {options.applyHair && <Sparkles className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-sm text-neutral-900 block">Kiểu tóc mới (Bắt buộc)</span>
                    <span className="text-xs text-neutral-500 line-clamp-1">{hairstyle.name}</span>
                  </div>
                </label>

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
                      <span className="font-bold text-sm text-neutral-900 block">Thêm phụ kiện (Kính/Mũ...)</span>
                      <span className="text-xs text-neutral-500">Tự động chọn phụ kiện hợp khuôn mặt</span>
                    </div>
                  </label>
                )}
                
                 {generalAdvice.propose_face && (
                  <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-200 has-[:checked]:border-black has-[:checked]:bg-neutral-50 transition cursor-pointer select-none">
                    <input type="checkbox" checked={options.applyFaceCare} onChange={e => setOptions(p => ({ ...p, applyFaceCare: e.target.checked }))} className="hidden" />
                    <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${options.applyFaceCare ? 'bg-black border-black' : 'border-neutral-300'}`}>
                        <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-sm text-neutral-900 block">Skin Retouch (Làm mịn da)</span>
                      <span className="text-xs text-neutral-500">Giả lập kết quả sau khi chăm sóc da</span>
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
              disabled={isGenerating}
              className="w-full py-4 bg-black text-white rounded-xl font-bold text-base hover:bg-neutral-800 transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-neutral-200 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI đang xử lý (15s)...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Tạo ảnh ngay
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}