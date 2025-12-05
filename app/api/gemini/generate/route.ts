// //E:\NextJs\test-barber\app\api\gemini\generate\route.tsx
// import { editImage } from "@/lib/gemini";
// export async function POST(request: Request) {
//     try {
//         const { imageBase64, prompt } = await request.json();
//         if (!imageBase64 || !prompt) {
//             return new Response(JSON.stringify({ error: "Missing imageBase64 or prompt in request body." }), {
//                 status: 400,
//                 headers: { 'Content-Type': 'application/json',
//                     Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`
//                  },
//             });
//         }
//         const editedImage = await editImage(imageBase64, prompt);
//         return new Response(JSON.stringify({ editedImage }), {
//             status: 200,
//             headers: { 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`
//              },
//         });
//     }
//     catch (error) {
//         console.error("Error in /api/gemini/generate route:", error);
//         return new Response(JSON.stringify({ error: (error as Error).message || "Internal Server Error" }), {
//             status: 500,
//             headers: { 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}` },
//         });
//     }
// }
// E:\NextJs\test-barber\app\api\gemini\generate\route.tsx

// app/api/gemini/generate/route.tsx
// app/api/gemini/generate/route.ts
import { editImage, mockEditImage } from "@/lib/gemini";
import { prisma } from '@/lib/supabase/prisma/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// --- CONFIG ---
const USE_MOCK_IMAGE = true; // Đổi thành TRUE nếu muốn test mà không gọi AI (tiết kiệm)
const COST_PER_GENERATE = 1; 

export async function POST(request: Request) {
    let userId = "";
    
    try {
        // 1. Xác thực User
        const supabase = await createSupabaseServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: "Unauthorized: Vui lòng đăng nhập" }, { status: 401 });
        }
        userId = user.id;

        // 2. TRANSACTION: Trừ tiền trước (Atomic)
        await prisma.$transaction(async (tx) => {
            const dbUser = await tx.user.findUnique({
                where: { id: userId },
                select: { credits: true }
            });

            if (!dbUser || dbUser.credits < COST_PER_GENERATE) {
                throw new Error("INSUFFICIENT_CREDITS");
            }

            await tx.user.update({
                where: { id: userId },
                data: { credits: { decrement: COST_PER_GENERATE } }
            });
        });

        // 3. Parse Body
        const { imageBase64, prompt } = await request.json();
        if (!imageBase64 || !prompt) {
            throw new Error("INVALID_INPUT");
        }

        // 4. Gọi AI Generate
        let editedImage;
        if (USE_MOCK_IMAGE) {
            editedImage = await mockEditImage(imageBase64, prompt); 
        } else {
            editedImage = await editImage(imageBase64, prompt); 
        }

        // 5. Lấy số dư mới nhất để trả về Client
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { credits: true }
        });

        return NextResponse.json({ 
            editedImage, 
            remainingCredits: updatedUser?.credits || 0 
        });

    } catch (error: any) {
        console.error("Generate Error:", error.message);

        // --- XỬ LÝ HOÀN TIỀN NẾU LỖI SAU KHI ĐÃ TRỪ ---
        if (error.message === "INSUFFICIENT_CREDITS") {
            return NextResponse.json({ error: "Bạn không đủ lượt dùng." }, { status: 402 });
        }

        if (userId && error.message !== "INSUFFICIENT_CREDITS" && error.message !== "Unauthorized") {
            // Hoàn tiền lại cho user
            await prisma.user.update({
                where: { id: userId },
                data: { credits: { increment: COST_PER_GENERATE } }
            }).catch(e => console.error("FATAL: Lỗi hoàn tiền", e));
        }

        return NextResponse.json({ 
            error: error.message === "INVALID_INPUT" ? "Dữ liệu không hợp lệ" : "Lỗi xử lý AI, hệ thống đã hoàn lại lượt dùng cho bạn." 
        }, { status: 500 });
    }
}