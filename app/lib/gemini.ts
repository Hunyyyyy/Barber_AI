import { GoogleGenAI } from "@google/genai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod"; // Optional

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const GeneralAdviceSchema = z.object({
  should_perm: z.string(),
  should_side_press: z.string(),
  color_suggestion: z.string(),
  dyeing_method: z.string(),
  aftercare_do: z.array(z.string()),
  aftercare_dont: z.array(z.string()),
  rpg_color_suggestion: z.string(),
  accessory: z.object({
    hat: z.string(),
    glasses: z.string(),
    necklace: z.string(),
    earring: z.string(),
    bracelet: z.string(),
    watch: z.string(),
  }),
  propose_face: z.string(),
  clothing_recommendations: z.string(),

});


// Schema giữ nguyên như trước
const HairstyleSchema = z.object({
  name: z.string(),
  english_name: z.string(),
  why_suitable: z.string(),
  how_to_style: z.string(),
  maintenance: z.string(),
  recommended_products: z.string(),
  celebrity_example: z.string().optional(),
});

// SCHEMA MỚI: BAO GỒM CẢ 2 PHẦN
const FullResponseSchema = z.object({
  general_advice: GeneralAdviceSchema,
  hairstyles: z.array(HairstyleSchema),
});
const ErrorResponseSchema = z.object({
  error: z.literal("Lỗi phân tích ảnh"),
  reason: z.string(),
});
const analysisModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.7,
  },
  systemInstruction: "Bạn là chuyên gia tạo kiểu tóc hàng đầu Việt Nam. Luôn trả lời ngắn gọn, chuyên nghiệp bằng tiếng Việt.",
});

export async function analyzeFaceAndSuggestHairstyles(imageBase64: string) {
  const prompt = `
Phân tích khuôn mặt trong ảnh (hình dáng, độ tuổi, phong cách, chất tóc, độ dày). Đề xuất CHÍNH XÁC 3 kiểu tóc NAM hoặc NỮ phù hợp nhất(có thể giữ lại kiểu tóc cũ nếu bạn cảm thấy kiểu tóc đó đã phù hợp với khuôn mặt).
Nếu ảnh không rõ mặt, không phải con người hoặc không thể phân tích, hãy báo lỗi.
HÃY TRẢ VỀ CHÍNH XÁC ĐỊNH DẠNG JSON SAU, KHÔNG TRẢ VỀ TEXT KHÁC:
{
  "error": "Lỗi phân tích ảnh",
  "reason": "Mặt không rõ, hoặc không thể phân tích."
}
NẾU ẢNH HỢP LỆ:
Trả về CHÍNH XÁC định dạng JSON sau, KHÔNG thêm text thừa:

{
  "general_advice": {
    "should_perm": "Có/Không nên uốn tóc và lý do (1 câu ngắn dựa trên chất tóc trong ảnh)",
    "should_side_press": "Có/Không nên ép side (Side Part) và lý do (1 câu ngắn)",
    "color_suggestion": "Màu nhuộm tóc phù hợp nhất hoặc không cần màu nhuộm (ví dụ: Nâu hạt dẻ, Xám khói)",
    "dyeing_method": "Kiểu nhuộm đề xuất hoặc không cần nhuộm (ví dụ: Nhuộm toàn bộ, Highlight ẩn, Ombre)",
    "rpg_color_suggestion": "Mã màu tóc phù hợp nhất theo chuẩn RGB (ví dụ: #A0522D cho Nâu hạt dẻ) hoặc để màu đen",
    "accessory":{
      "hat":"Gợi ý phụ kiện đội đầu phù hợp với kiểu tóc và khuôn mặt (ví dụ: Mũ lưỡi trai, Mũ beret, Băng đô, etc...)",
      "glasses":"Gợi ý phụ kiện kính mắt phù hợp với kiểu tóc và khuôn mặt (ví dụ: Kính gọng tròn, Kính gọng vuông, Kính mát, etc...)",
      "necklace":"Gợi ý phụ kiện vòng cổ phù hợp với kiểu tóc và khuôn mặt (ví dụ: Dây chuyền bạc, Vòng cổ choker, Vòng da, etc...)",
      "earring":"Gợi ý phụ kiện bông tai phù hợp với kiểu tóc và khuôn mặt (ví dụ: Bông tai tròn, Bông tai dài, Bông tai stud, etc...)",
      "bracelet":"Gợi ý phụ kiện vòng tay phù hợp với kiểu tóc và khuôn mặt (ví dụ: Vòng tay bạc, Vòng tay da, Vòng tay charm, etc...)",
      "watch":"Gợi ý phụ kiện đồng hồ phù hợp với kiểu tóc và khuôn mặt (ví dụ: Đồng hồ dây da, Đồng hồ kim loại, Đồng hồ thể thao, etc...)"
    },
    "propose_face":"Cách để có được da mặt đẹp, sạch mụn phù hợp với độ tuổi và kiểu tóc, ví dụ:Bạn sẽ trông trẻ trung hơn nếu chăm sóc da mặt đúng cách bằng việc rửa mặt 2 lần/ngày và sử dụng kem dưỡng ẩm nhẹ  và liên tục trong vòng (số tháng tự bạn đề xuất) tháng .(tên sản phẩm phổ biến ở Việt Nam nếu có)",
    "clothing_recommendations":"Gợi ý trang phục phù hợp với kiểu tóc và phong cách cá nhân. Chỉ gợi ý thay đổi trang phục trong khung hình như áo,áo khoác,áo ấm,etc...,quần short,quần jean,quần dài,etc...,giày sneaker,etc...(ví dụ: nếu chỉ chụp nửa thân trên thì chỉ tập trung vào áo).",
    "aftercare_do": [
      "Đề xuất dầu goội, dầu xả, và sản phẩm tạo kiểu phù hợp với kiểu tóc và chất tóc trong ảnh (tên sản phẩm phổ biến ở Việt Nam nếu có).",
      "Sử dụng dầu gội và dầu xả chuyên dụng cho tóc đã qua xử lý nhiệt hoặc hóa chất.",
      "Dùng sáp hoặc pomade có độ giữ nếp trung bình để tạo kiểu hàng ngày.",
      "Hấp dầu hoặc ủ tóc 1-2 lần/tuần để cung cấp độ ẩm."
    ],
    "aftercare_dont": [
      "Tránh gội đầu bằng nước quá nóng vì sẽ làm tóc khô và phai màu nhanh.",
      "Không chải tóc khi còn ướt hoàn toàn để tránh làm đứt và yếu sợi tóc.",
      "Hạn chế sử dụng máy sấy tóc ở nhiệt độ cao thường xuyên."
    ]
  },
  "hairstyles": [
     {
      "name": "Tên kiểu tóc (tiếng Việt)",
      "english_name": "English name",
      "why_suitable": "Lý do phù hợp (2-3 câu ngắn)",
      "how_to_style": "Cách tạo kiểu chi tiết nhất để gemini AI tạo ảnh có thể hiểu được",
      "maintenance": "Độ khó chăm sóc (Dễ / Trung bình / Khó)",
      "recommended_products": "Gợi ý sản phẩm (tên phổ biến VN)",
      "celebrity_example": "Người nổi tiếng tương tự (nếu có)",
    },
     {
      "name": "Tên kiểu tóc (tiếng Việt)",
      "english_name": "English name",
      "why_suitable": "Lý do phù hợp (2-3 câu ngắn)",
      "how_to_style": "Cách tạo kiểu chi tiết nhất để gemini AI tạo ảnh có thể hiểu được",
      "maintenance": "Độ khó chăm sóc (Dễ / Trung bình / Khó)",
      "recommended_products": "Gợi ý sản phẩm (tên phổ biến VN)",
      "celebrity_example": "Người nổi tiếng tương tự (nếu có)",
    },
    {
      "name": "Tên kiểu tóc (tiếng Việt)",
      "english_name": "English name",
      "why_suitable": "Lý do phù hợp (2-3 câu ngắn)",
      "how_to_style": "Cách tạo kiểu chi tiết nhất để gemini AI tạo ảnh có thể hiểu được",
      "maintenance": "Độ khó chăm sóc (Dễ / Trung bình / Khó)",
      "recommended_products": "Gợi ý sản phẩm (tên phổ biến VN)",
      "celebrity_example": "Người nổi tiếng tương tự (nếu có)",
    }
  ]
}
`;

  const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
  const mimeType = imageBase64.match(/data:image\/([a-z]+);base64/)?.[1] || "jpeg";

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: `image/${mimeType}`,
    },
  };

  const result = await analysisModel.generateContent([prompt, imagePart]);
  const response = await result.response;
  const jsonStr = await response.text().trim();

  try {
    const parsed = JSON.parse(jsonStr);
    
    // Logic kiểm tra lỗi đơn giản dựa trên trường "error"
    if (parsed.error) {
      // Nếu là JSON lỗi theo format đã định
      throw new Error(`[Lỗi AI]: ${parsed.reason}`);
    }

    // Nếu không có lỗi, trả về kết quả phân tích
    return parsed;
  } catch (e) {
    console.error("Lỗi phân tích/parse JSON:", (e as Error).message, jsonStr);
    throw new Error("Phản hồi JSON không hợp lệ hoặc lỗi AI không xác định. Thử lại với ảnh rõ hơn.");
  }
}



const apiKey = process.env.API_KEY;

if (!apiKey) {
    // This is a fallback for development, but the app expects the key to be injected.
    console.warn("API_KEY environment variable not set. Using a placeholder.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || " " });

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

        const response = await ai.models.generateContent({
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
    // Dùng để mock response thành công và hiển thị ảnh thử trong modal.
    const MOCK_IMAGE_BASE64 = 
        'data:image/png;base64,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';
        
    // Giả lập độ trễ của API
    await new Promise(resolve => setTimeout(resolve, 2500)); 

    console.log(`[MOCK] Gọi thành công hàm mockEditImage với prompt: ${_prompt}`);

    return MOCK_IMAGE_BASE64;
};