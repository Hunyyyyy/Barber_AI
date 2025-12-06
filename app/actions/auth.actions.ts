// actions/auth.actions.ts
"use server";

import { prisma } from '@/lib/supabase/prisma/db'; // Import Prisma Client
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SignInSchema, SignUpSchema } from '@/lib/validation';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// === ĐĂNG KÝ (Logic đã Sửa) ===
export async function registerAction(prevState: any, formData: FormData) {
    // Lưu ý: createSupabaseServerClient() cần phải sử dụng Service Role Key
    // để có quyền gọi supabase.auth.admin.deleteUser()
    const supabase = await createSupabaseServerClient(); 
    
    // 1. Validate dữ liệu đầu vào (GIỮ NGUYÊN)
    const validated = SignUpSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        password: formData.get('password'),
    });
 

    if (!validated.success) {
        return {
            success: false,
            fieldErrors: validated.error.flatten().fieldErrors,
            formError: null
        };
    }

    const { email, password, name, phone } = validated.data;
    
    // =======================================================
    // 1.5. KIỂM TRA TÍNH DUY NHẤT CỦA SĐT TRƯỚC (QUAN TRỌNG)
    // =======================================================
    try {
        const existingPhone = await prisma.user.findUnique({
            where: { phone },
        });

        if (existingPhone) {
            // Nếu trùng SĐT trong DB -> Dừng lại ngay lập tức
            return { 
                success: false, 
                fieldErrors: { phone: ['Số điện thoại này đã được sử dụng.'] },
                formError: null 
            };
        }
    } catch (dbError) {
        // Xử lý lỗi DB khi kiểm tra
        console.error('Lỗi kiểm tra SĐT DB:', dbError);
        return { success: false, formError: 'Lỗi hệ thống khi kiểm tra dữ liệu.' };
    }
    
    // =======================================================
    // 2. Tạo User bên Supabase Auth (CHỈ GỌI KHI SĐT HỢP LỆ)
    // =======================================================
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { fullName: name, phone,role: 'USER' }, // Lưu metadata (Đổi name thành fullName cho rõ ràng)
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email`,
        },
    });

    if (error) {
        console.error('Lỗi đăng ký Supabase Auth:', error.message);
        return { success: false, formError: "Có lỗi xảy ra trong lúc đăng ký!" };
    }

    // Check user identities (Giữ nguyên)
    if (data.user?.identities && data.user.identities.length === 0) {
        return {
            success: false,
            fieldErrors: { email: ['Email này đã được đăng ký. Vui lòng đăng nhập.'] },
            formError: null,
        };
    }

    if (!data.user) {
        return { success: false, formError: 'Không thể tạo tài khoản Supabase.' };
    }

    // =======================================================
    // 3. ĐỒNG BỘ USER VÀO DATABASE CHÍNH (PRISMA)
    // =======================================================
    try {
        // Chỉ cần tạo User mới trong bảng User khớp ID với Supabase
        await prisma.user.create({
            data: {
                id: data.user.id, // ID khớp với Supabase Auth ID
                email: email,
                phone: phone?.toString() || '', // Đã được kiểm tra tính duy nhất ở Bước 1.5
                fullName: name,
                passwordHash: 'supabase_managed', 
                role: 'USER',
                avatarUrl: null,
                credits: 5,
            },
        });
        
    } catch (dbError: any) {
        console.error('Lỗi tạo profile DB:', dbError);
        
        // QUAN TRỌNG: Nếu lỗi DB ở đây, PHẢI xóa User đã tạo bên Supabase Auth để Rollback
        await supabase.auth.admin.deleteUser(data.user.id); 
        
        return { 
            success: false, 
            formError: 'Đăng ký thành công nhưng lỗi khởi tạo hồ sơ. Vui lòng liên hệ CSKH.' 
        };
    }

    return { success: true, message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.' };
}

// === ĐĂNG NHẬP ===
export async function loginAction(prevState: any, formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const validated = SignInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const { email, password } = validated.data;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Lỗi đăng nhập Supabase Auth:', error.message);
    return { error: { message: 'Email hoặc mật khẩu không đúng' } };
  }
  // Lấy thông tin user từ DB để check role chính xác nhất
  const dbUser = await prisma.user.findUnique({
    where: { id: data.user.id },
    select: { role: true }
  });
  if (!data.session) {
    return { error: { message: 'Lỗi phiên đăng nhập.' } };
  }

  // Xóa cache để cập nhật UI
 revalidatePath('/', 'layout');

  // LOGIC REDIRECT THÔNG MINH
  if (dbUser?.role === 'ADMIN') {
    redirect('/admin');
  } else if (dbUser?.role === 'BARBER') {
    redirect('/home'); // Hoặc trang dành riêng cho thợ
  } else {
    // User thường
    const redirectTo = formData.get('redirectTo')?.toString() || '/home';
    redirect(redirectTo);
  }
}

// === ĐĂNG XUẤT ===
export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  
  revalidatePath('/', 'layout');
  redirect('/login');
}

// === ĐĂNG NHẬP GOOGLE ===
export async function loginWithGoogle() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return data.url ? redirect(data.url) : null;
}