"use server";

import { prisma } from '@/lib/supabase/prisma/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Helper: Upload ảnh Base64 lên Supabase Storage
 * Trả về Public URL
 */
async function uploadBase64Image(base64Data: string, userId: string, folder: 'originals' | 'generated'): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // 1. Chuẩn bị dữ liệu
    // Base64 thường có dạng "data:image/png;base64,iVBORw0KGgo..."
    // Cần tách phần header ra để lấy buffer
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 string');
    }
    
    const buffer = Buffer.from(matches[2], 'base64');
    const fileExt = matches[1].split('/')[1] || 'png';
    const fileName = `${userId}/${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

    // 2. Upload (Cần tạo bucket 'hair-app' trong Supabase Dashboard trước)
    // Nếu chưa có bucket, hãy vào Storage -> New Bucket -> 'hair-app' (Public)
    const { error: uploadError } = await supabase.storage
      .from('hair-app') 
      .upload(fileName, buffer, {
        contentType: matches[1],
        upsert: true
      });

    if (uploadError) {
        console.error("Storage Upload Error:", uploadError);
        return null;
    }

    // 3. Lấy Public URL
    const { data } = supabase.storage
      .from('hair-app')
      .getPublicUrl(fileName);

    return data.publicUrl;

  } catch (error) {
    console.error("Upload Helper Error:", error);
    return null;
  }
}

/**
 * ACTION 1: Lưu kết quả Phân tích (HairAnalysis)
 * Gọi khi: Gemini phân tích xong (bước Result trong trang Suggest)
 */
export async function saveAnalysisResult(
  originalImageBase64: string, 
  analysisResultJson: any
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // 1. Upload ảnh gốc lên Storage
    const originalUrl = await uploadBase64Image(originalImageBase64, user.id, 'originals');
    
    if (!originalUrl) {
        return { success: false, error: "Lỗi khi lưu ảnh gốc." };
    }

    // 2. Lưu vào DB
    const analysis = await prisma.hairAnalysis.create({
      data: {
        userId: user.id,
        originalImageUrl: originalUrl,
        analysisResult: analysisResultJson, // Prisma tự convert JSON
      }
    });

    return { success: true, analysisId: analysis.id };

  } catch (error: any) {
    console.error("Save Analysis Error:", error);
    return { success: false, error: "Lỗi hệ thống khi lưu phân tích." };
  }
}

/**
 * ACTION 2: Lưu lịch sử tạo ảnh (GeneratedStyle)
 * Gọi khi: Người dùng bấm "Tạo ảnh" trong TryOnModal và thành công
 */
export async function saveGeneratedImage(
  analysisId: string,
  styleName: string,
  generatedBase64: string,
  technicalDescription: string
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // 1. Upload ảnh AI tạo ra
    const generatedUrl = await uploadBase64Image(generatedBase64, user.id, 'generated');

    if (!generatedUrl) {
        return { success: false, error: "Lỗi khi lưu ảnh AI." };
    }

    // 2. Lưu vào DB
    const generated = await prisma.generatedStyle.create({
      data: {
        analysisId: analysisId,
        styleName: styleName,
        generatedImageUrl: generatedUrl,
        technicalDescription: technicalDescription
      }
    });

    return { success: true, generatedId: generated.id, imageUrl: generatedUrl };

  } catch (error: any) {
    console.error("Save Generated Error:", error);
    return { success: false, error: "Lỗi khi lưu ảnh tạo ra." };
  }
}

/**
 * ACTION 3: Lưu vào Bộ sưu tập (SavedHairstyle)
 * Gọi khi: Người dùng bấm nút "Lưu vào bộ sưu tập"
 */
export async function saveToCollection(
  styleName: string,
  englishName: string,
  imageUrl: string, // Có thể là Base64 hoặc URL đã có
  technicalDescription: string
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Vui lòng đăng nhập để lưu." };

  try {
    let finalImageUrl = imageUrl;

    // Nếu ảnh là Base64 (chưa được upload), thì upload ngay
    if (imageUrl.startsWith('data:image')) {
        const uploaded = await uploadBase64Image(imageUrl, user.id, 'generated');
        if (uploaded) finalImageUrl = uploaded;
        else return { success: false, error: "Không thể upload ảnh." };
    }

    // Tạo bản ghi trong SavedHairstyle
    await prisma.savedHairstyle.create({
      data: {
        userId: user.id,
        styleName: styleName,
        englishName: englishName,
        imageUrl: finalImageUrl,
        technicalDescription: technicalDescription
      }
    });

    revalidatePath('/profile'); // Cập nhật trang profile nếu có list yêu thích
    return { success: true, message: "Đã lưu vào bộ sưu tập!" };

  } catch (error: any) {
    console.error("Save Collection Error:", error);
    return { success: false, error: "Lỗi khi lưu bộ sưu tập." };
  }
}