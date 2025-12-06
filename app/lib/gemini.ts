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