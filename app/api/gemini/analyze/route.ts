// app/api/gemini/analyze/route.ts
import { analyzeFaceAndSuggestHairstyles } from "@/lib/gemini";
import { prisma } from "@/lib/supabase/prisma/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let userId = "";

  try {
    // 1. CHECK AUTH
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized: Vui lòng đăng nhập" }, { status: 401 });
    }
    userId = user.id;

    // 2. CHẶN SPAM & TRỪ TIỀN (QUAN TRỌNG: Dùng Transaction)
    // Logic: Trừ tiền NGAY LẬP TỨC. Nếu spam 10 request, chỉ 1 cái trừ được, 9 cái kia sẽ lỗi do hết tiền.
    await prisma.$transaction(async (tx) => {
      // 2a. Khóa dòng user và lấy thông tin (tùy chọn khóa bi quan hoặc kiểm tra trực tiếp)
      const dbUser = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true }
      });

      // 2b. Kiểm tra số dư
      if (!dbUser || dbUser.credits < 1) {
        throw new Error("INSUFFICIENT_CREDITS"); // Ném lỗi để nhảy xuống catch
      }

      // 2c. Trừ tiền ngay (Trước khi gọi AI)
      await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: 1 } }
      });
    });

    // 3. XỬ LÝ AI (Lúc này tiền đã bị trừ an toàn)
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      throw new Error("INVALID_INPUT");
    }

    const analysisResult = await analyzeFaceAndSuggestHairstyles(imageBase64);

    // 4. TRẢ VỀ KẾT QUẢ
    return NextResponse.json(analysisResult);

  } catch (error: any) {
    console.error("Analyze Error:", error.message);

    // --- XỬ LÝ LỖI & HOÀN TIỀN ---

    // Trường hợp 1: Người dùng spam hoặc hết tiền
    if (error.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ message: "Bạn đã hết lượt dùng AI hoặc thao tác quá nhanh." }, { status: 429 }); // 429: Too Many Requests
    }

    // Trường hợp 2: Lỗi do AI hoặc Input (Lỗi hệ thống) -> PHẢI HOÀN TIỀN
    // Chỉ hoàn tiền nếu lỗi KHÔNG PHẢI là do thiếu tiền và userId đã được xác định
    if (userId && error.message !== "INSUFFICIENT_CREDITS") {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: 1 } } // Cộng lại 1 lượt
        });
        console.log(`Đã hoàn tiền cho user ${userId} do lỗi hệ thống.`);
      } catch (refundError) {
        console.error("CRITICAL: Lỗi hoàn tiền thất bại", refundError);
      }
    }

    const errorMessage = error.message === "INVALID_INPUT" ? "Thiếu ảnh đầu vào" : "Lỗi xử lý AI, đã hoàn lại lượt dùng.";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}