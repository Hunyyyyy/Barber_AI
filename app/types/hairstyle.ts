// app/types/hairstyle.ts

/**
 * Định nghĩa cho phần lời khuyên chung (General Advice)
 * mà Gemini trả về ngoài các kiểu tóc cụ thể.
 */
export interface GeneralAdvice {
  should_perm: string; // Có/Không nên uốn và lý do
  should_side_press: string; // Có/Không nên ép side và lý do
  color_suggestion: string; // Màu nhuộm phù hợp nhất
  dyeing_method: string; // Kiểu nhuộm đề xuất (ví dụ: Highlight)
  aftercare_do: string[]; // Những việc nên làm để duy trì tóc (mảng gạch đầu dòng)
  aftercare_dont: string[]; // Những việc nên tránh để tổn hại tóc (mảng gạch đầu dòng)
  rpg_color_suggestion: string; // Mã màu tóc phù hợp nhất theo chuẩn RGB
  accessory: {
    hat: string;
    glasses: string;
    necklace: string;
    earring: string;
    bracelet: string;
    watch: string;
  };
  propose_face: string; // Cách để có được da mặt đẹp, sạch mụn phù hợp với độ tuổi và kiểu tóc
  clothing_recommendations: string; // Gợi ý trang phục phù hợp với kiểu tóc và phong cách cá nhân
}

/**
 * Định nghĩa cho từng kiểu tóc được đề xuất bởi Gemini.
 */
export interface Hairstyle {
  name: string;
  english_name: string;
  why_suitable: string;
  how_to_style: string;
  maintenance: string;
  recommended_products: string;
  celebrity_example?: string;
  
  // Các trường bổ sung được thêm vào ở client-side
  images?: string[]; // URL 5 ảnh mẫu (lấy từ Custom Search API)
  face_shape?: string[]; // Hình dạng khuôn mặt phù hợp
  hair_type?: string[]; // Loại tóc phù hợp
}

/**
 * Định nghĩa cấu trúc phản hồi cuối cùng từ API/Gemini.
 */
export interface GeminiResponse {
  general_advice: GeneralAdvice; // <-- NEW: Thêm lời khuyên chung
  hairstyles: Hairstyle[];
}