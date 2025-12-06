import { GoogleGenAI } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// --- CẤU HÌNH KEY ROTATION (CHỈ CHO PHẦN PHÂN TÍCH) ---
// Lấy danh sách key từ biến môi trường GEMINI_API_KEYS_ANALYSIS, tách dấu phẩy
const analysisApiKeys = (process.env.GEMINI_API_KEYS_ANALYSIS || process.env.GEMINI_API_KEY || "")
  .split(',')
  .map(key => key.trim())
  .filter(key => key.length > 0);

if (analysisApiKeys.length === 0) {
  console.warn("⚠️ CẢNH BÁO: Không tìm thấy GEMINI_API_KEYS_ANALYSIS trong biến môi trường.");
}

// --- ĐỊNH NGHĨA SCHEMA (GIỮ NGUYÊN) ---
const GeneralAdviceSchema = z.object({
  should_perm: z.string(),
  should_side_press: z.string(),
  color_suggestion: z.string(),
  dyeing_method: z.string(),
  aftercare_do: z.array(z.string()),
  aftercare_dont: z.array(z.string()),
  rpg_color_suggestion: z.string(),
  accessory: z.object({
    glasses: z.string(),
    necklace: z.string(),
    earring: z.string(),
    bracelet: z.string(),
    watch: z.string(),
  }),
  propose_face: z.string(),
  clothing_recommendations: z.string(),
});

const HairstyleSchema = z.object({
  name: z.string(),
  english_name: z.string(),
  why_suitable: z.string(),
  how_to_style: z.string(),
  technical_description: z.string().describe("A detailed visual description in English for AI image generator, focusing on hair texture, length, volume, and cut structure."),
  maintenance: z.string(),
  recommended_products: z.string(),
  celebrity_example: z.string().optional(),
});

// SCHEMA FULL
const FullResponseSchema = z.object({
  general_advice: GeneralAdviceSchema,
  hairstyles: z.array(HairstyleSchema),
});

// --- SYSTEM INSTRUCTION (TÁCH RA ĐỂ DÙNG CHUNG CHO CÁC KEY) ---
const SYSTEM_INSTRUCTION = `Bạn là World-Class Barber & Stylist & Colorist với 20 năm kinh nghiệm tại Việt Nam.
  Sở trường của bạn là 'Visagism' (Nghệ thuật tạo mẫu tóc dựa trên khuôn mặt) và Kỹ thuật hóa chất (Uốn/Nhuộm).

  --- KIẾN THỨC CHUYÊN MÔN (KNOWLEDGE BASE) ---
  Khi đề xuất kiểu tóc, hãy áp dụng các kiến thức sau đây để tạo ra 'technical_description' chính xác:

  1. NHÓM MÀU NHUỘM (DYE COLORS):
     - Tông Nâu (Browns - An toàn): Chestnut Brown, Chocolate Brown, Dark Tea, Coffee Milk. -> Prompt: "chestnut brown hair", "chocolate brown hair".
     - Tông Khói/Lạnh (Ash/Cold - Thời thượng): Ash Grey, Ash Brown, Smoky Blue, Charcoal (Than chì). -> Prompt: "ash grey hair", "charcoal grey hair", "cool tone".
     - Tông Sáng (Bright - Phá cách): Platinum, Honey Blonde, Moss Green, Pastel Pink. -> Prompt: "platinum blonde hair", "moss green hair".

  2. KỸ THUẬT NHUỘM (DYE TECHNIQUES):
     - Full Color: Nhuộm đều. -> Prompt: "consistent all-over color".
     - Highlight: Gẩy light. -> Prompt: "with distinct blonde highlights", "high contrast streaks".
     - Ombre: Chuyển màu. -> Prompt: "ombre gradient from dark roots to light ends".
     - Balayage: Loang màu tự nhiên. -> Prompt: "balayage painting style, soft color transition".
     - Frosted Tips: Nhuộm ngọn. -> Prompt: "frosted tips, lightened hair ends only".

  3. KIỂU UỐN (PERM STYLES):
     - Uốn Phồng (Volume Perm): Tạo độ phồng chân. -> Prompt: "voluminous roots, soft c-curl, airy texture".
     - Uốn Gợn Sóng (Wavy Perm): Sóng lơi Hàn Quốc. -> Prompt: "soft korean wavy perm, s-shaped waves, romantic texture".
     - Uốn Con Sâu (Worm/Texture Perm): Xoăn cứng, cá tính. -> Prompt: "texture worm perm, defined zig-zag coils, foil perm texture, rough look".
     - Uốn Xoăn Rối (Messy Curly): Xoăn tự do. -> Prompt: "messy curly hair, chaotic bedhead texture, frizzy details".
     - Premlock/Afro: Xoăn tít. -> Prompt: "afro texture, tight sponge curls, dense coils".

  --- NHIỆM VỤ ---
  1. Phân tích hình dáng khuôn mặt và chất tóc trong ảnh.
  2. Đề xuất 3 kiểu tóc giúp "hack dáng mặt". Cố gắng kết hợp ít nhất 1 kiểu có Uốn hoặc Nhuộm dựa trên kiến thức trên.
  
  --- QUY TẮC CHO 'technical_description' (Tiếng Anh) ---
  - Bắt buộc dùng cấu trúc: "Hyper-realistic close-up portrait of [Subject] with [Hairstyle Name]. [Texture/Perm Description]. [Color/Dye Description]. [Cut Technique]. [Face Fit]. High detail hair strands, 8k resolution."
  - Ví dụ: "Hyper-realistic close-up portrait of a man with a Mohican hairstyle. Texture worm perm with distinct zig-zag coils giving a rough look. Dyed in Smoky Ash Grey with Frosted Tips. High skin fade on sides. 8k resolution, cinematic lighting."
`;

// Helper để lấy model từ một key cụ thể
const getAnalysisModel = (apiKey: string) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
    },
    systemInstruction: SYSTEM_INSTRUCTION,
  });
};

// --- HÀM CHÍNH ĐÃ SỬA ĐỔI (ÁP DỤNG KEY ROTATION) ---
export async function analyzeFaceAndSuggestHairstyles(imageBase64: string) {
  const prompt = `
  Phân tích bức ảnh chân dung này thật kỹ (Shape mặt, Jawline, trán).

  Hãy đề xuất 3 kiểu tóc NAM hoặc NỮ phù hợp nhất. 
  - Nếu thấy phù hợp, hãy gợi ý các kiểu uốn (Con sâu, Gợn sóng, Phồng...) hoặc nhuộm (Nâu, Khói, Highlight...).
  - Đảm bảo mô tả kỹ thuật (technical_description) phải chứa các từ khóa tiếng Anh tương ứng với kiểu uốn/nhuộm đó (ví dụ: Worm Perm, Ash Grey, Ombre...).

  HÃY TRẢ VỀ CHÍNH XÁC ĐỊNH DẠNG JSON SAU:
  {
    "general_advice": {
      "should_perm": "Có/Không và kiểu uốn gợi ý (ví dụ: Nên uốn phồng chân tóc...)",
      "should_side_press": "Có/Không ép side...",
      "color_suggestion": "Tên màu cụ thể (ví dụ: Nâu trà đen, Xám khói...)",
      "dyeing_method": "Kỹ thuật nhuộm (Full, Ombre, Highlight...)",
      "rpg_color_suggestion": "Mã HEX màu (ví dụ #5D4037)",
      "accessory": { ... },
      "propose_face": "Lời khuyên chăm sóc da...",
      "clothing_recommendations": "Gợi ý trang phục...",
      "aftercare_do": [...],
      "aftercare_dont": [...]
    },
    "hairstyles": [
       {
        "name": "Tên kiểu tóc (kèm kiểu uốn/nhuộm nếu có)",
        "english_name": "Standard English Name",
        "why_suitable": "Tại sao hợp khuôn mặt này...",
        "how_to_style": "Cách sấy/vuốt...",
        "technical_description": "Prompt tiếng Anh cực chi tiết về Texture (Uốn), Color (Nhuộm), Cut...",
        "maintenance": "Dễ/Trung bình/Khó",
        "recommended_products": "Sáp/Gôm...",
        "celebrity_example": "Tên người nổi tiếng"
      },
      ...
    ]
  }
  
  Nếu ảnh lỗi, trả về: { "error": "Lỗi phân tích ảnh", "reason": "..." }
  `;

  const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
  const mimeType = imageBase64.match(/data:image\/([a-z]+);base64/)?.[1] || "jpeg";

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: `image/${mimeType}`,
    },
  };

  // --- LOGIC XOAY VÒNG KEY ---
  // Xáo trộn danh sách key để load balancing (tránh key đầu tiên luôn hết trước)
  const shuffledKeys = [...analysisApiKeys].sort(() => 0.5 - Math.random());
  
  // Biến lưu lỗi cuối cùng để throw nếu tất cả key đều chết
  let lastError: any = null;

  for (const apiKey of shuffledKeys) {
    try {
      // 1. Khởi tạo model với key hiện tại trong vòng lặp
      const currentModel = getAnalysisModel(apiKey);
      console.log(`🤖 Đang phân tích tóc với Key ending: ...${apiKey.slice(-4)}`);

      // 2. Gọi API
      const result = await currentModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      const jsonStr = await response.text().trim();

      // 3. Parse JSON
      const parsed = JSON.parse(jsonStr);
      
      if (parsed.error) {
        throw new Error(`[Lỗi AI logic]: ${parsed.reason}`);
      }

      // Nếu thành công -> Trả về kết quả và THOÁT KHỎI HÀM NGAY LẬP TỨC
      return parsed;

    } catch (e: any) {
      console.warn(`⚠️ Key ...${apiKey.slice(-4)} thất bại: ${e.message}`);
      lastError = e;

      // Kiểm tra xem có phải lỗi do hết hạn mức (429) không
      const isQuotaError = e.message.includes("429") || 
                           e.message.includes("quota") || 
                           e.message.includes("Resource has been exhausted");
      
      // Nếu là lỗi Quota, tiếp tục vòng lặp (continue) để thử key tiếp theo
      if (isQuotaError) {
        continue; 
      }
      
      // Nếu là lỗi khác (ví dụ JSON sai, ảnh lỗi), có thể throw luôn hoặc thử tiếp tùy bạn. 
      // Ở đây tôi chọn tiếp tục thử key khác cho chắc ăn, trừ khi list hết key.
      continue;
    }
  }

  // Nếu chạy hết vòng lặp mà không return được -> Ném lỗi cuối cùng
  console.error("❌ Tất cả API Key đều thất bại.");
  throw new Error(lastError?.message || "Hệ thống đang bận, vui lòng thử lại sau.");
}


// --- PHẦN EDIT IMAGE (GIỮ NGUYÊN NHƯ CŨ, KHÔNG ÁP DỤNG ROTATION) ---

// Key riêng cho Edit Image
const editImageApiKey = process.env.GEMINI_API_KEY_IMAGE;

if (!editImageApiKey) {
    console.warn("API_KEY environment variable for Image Edit not set.");
}

// Khởi tạo instance edit cố định 1 key
const aiEditInstance = new GoogleGenAI({ apiKey: editImageApiKey || " " });

const dataUrlToTuples = (dataUrl: string): { mimeType: string; data: string } => {
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
        throw new Error("Invalid image data URL format. Ensure it's a valid base64 string.");
    }
    return { mimeType: match[1], data: match[2] };
};

export const editImage = async (base64Image: string, prompt: string): Promise<string> => {
    try {
        const { mimeType, data } = dataUrlToTuples(base64Image);

        const imagePart = {
            inlineData: {
                mimeType,
                data,
            },
        };

        const textPart = {
            text: prompt,
        };

        // Sử dụng instance edit cố định
        const response = await aiEditInstance.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [imagePart, textPart],
            },
        });

        // The response might have multiple parts, we need to find the image part
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const newBase64Data = part.inlineData.data;
                const newMimeType = part.inlineData.mimeType;
                return `data:${newMimeType};base64,${newBase64Data}`;
            }
        }
        
        throw new Error("No image was generated in the API response. The prompt might have been blocked.");

    } catch (error) {
        console.error("Error editing image with Gemini:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("An unknown error occurred while communicating with the Gemini API.");
    }
};

export const mockEditImage = async (_base64Image: string, _prompt: string): Promise<string> => {
    // Base64 cho một hình ảnh PNG 4x4 pixel màu đen.
    const MOCK_IMAGE_BASE64 = 
        'data:image/png;base64,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';
        
    await new Promise(resolve => setTimeout(resolve, 2500)); 
    console.log(`[MOCK] Gọi thành công hàm mockEditImage với prompt: ${_prompt}`);
    return MOCK_IMAGE_BASE64;
};