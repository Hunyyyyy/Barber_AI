// app/api/search-hairstyle-image/route.ts
import { searchHairstyleImage } from "@/lib/googleImageSearch";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const gender = searchParams.get("gender"); // "male" | "female"

  if (!name) {
    return NextResponse.json(
      { error: "Thiếu tên kiểu tóc" },
      { status: 400 }
    );
  }

  try {
    // Gọi hàm và yêu cầu trả về 5 ảnh
    const imageUrls = await searchHairstyleImage( 
      name,
      gender === "female" ? false : true,
      5 // <-- YÊU CẦU 5 ẢNH
    );

    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy ảnh" },
        { status: 404 }
      );
    }

    // <-- THAY ĐỔI: Trả về { imageUrls: string[] }
    return NextResponse.json({ imageUrls }); 
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Lỗi server" },
      { status: 500 }
    );
  }
}