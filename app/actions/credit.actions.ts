"use server";
import { prisma } from '@/lib/supabase/prisma/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function createTopUpOrder(amount: number, credits: number) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // Tạo mã nạp ngẫu nhiên ngắn gọn: VD: NAP + 5 số cuối timestamp
    const code = `NAP${Date.now().toString().slice(-6)}`;

    const order = await prisma.creditTransaction.create({
        data: {
            userId: user.id,
            amount,
            credits,
            code,
            status: 'PENDING'
        }
    });

    return { success: true, order };
}