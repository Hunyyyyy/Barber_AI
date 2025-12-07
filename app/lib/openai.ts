// app/lib/openai.ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

/**
 * Helper: Convert Base64 string (PNG/JPG) thành File object mà OpenAI SDK yêu cầu
 */
async function base64ToFile(base64String: string, fileName: string) {
  // 1. Loại bỏ header "data:image/png;base64," (nếu có)
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  
  // 2. Tạo Buffer từ chuỗi base64
  const buffer = Buffer.from(base64Data, 'base64');

  // 3. Dùng helper của OpenAI để convert Buffer thành File object
  return await OpenAI.toFile(buffer, fileName);
}

export async function createImageFromOpenAI(imageBase64: string, prompt: string): Promise<string> {
  try {
    if (!imageBase64) throw new Error("Cần có ảnh gốc để thực hiện chỉnh sửa!");

    // 1. Convert Base64 sang File
    // OpenAI yêu cầu ảnh đầu vào phải là PNG và có kích thước tối đa 4MB.
    const imageFile = await base64ToFile(imageBase64, "input_portrait.png");

    // 2. GỌI ENDPOINT EDIT VỚI GPT-IMAGE-1
    /* LƯU Ý QUAN TRỌNG:
      - Endpoint images.edit yêu cầu ảnh phải có VÙNG TRONG SUỐT (mask) để biết vẽ vào đâu. 
      - Để mô phỏng hành vi của Gemini (tự tìm vùng tóc), ta gửi cùng 1 file cho cả 'image' và 'mask' 
        nhưng bạn phải đảm bảo ảnh đầu vào (imageBase64) là PNG và đã được xóa nền vùng tóc.
    */
    const response = await openai.images.edit({
      model: "gpt-image-1", // Dùng model mới nhất
      image: imageFile,  
      mask: imageFile,   // Gửi ảnh gốc (đã xử lý transparency) làm mask
      prompt: prompt,
      size: "1024x1024",
      response_format: "b64_json",
      
      // MỚI: Bạn có thể thử thêm background: 'transparent' ở đây nếu muốn ghép ảnh sau
      // Ví dụ: background: "transparent",
    });

    const b64 = response.data?.[0]?.b64_json;
    
    if (!b64) throw new Error("Không nhận được ảnh trả về từ OpenAI!");

    return `data:image/png;base64,${b64}`; 
  } catch (err: any) {
    console.error("❌ Lỗi tạo ảnh OpenAI:", err);
    throw new Error(err.message || "Không tạo được ảnh từ OpenAI");
  }
}