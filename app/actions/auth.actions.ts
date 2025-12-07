// actions/auth.actions.ts
"use server";

import { prisma } from '@/lib/supabase/prisma/db'; // Import Prisma Client
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SignInSchema, SignUpSchema } from '@/lib/validation';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// === ĐĂNG KÝ (Logic đã Sửa) ===
export async function registerAction(prevState: any, formData: FormData) {
    const supabase = await createSupabaseServerClient(); 
    
    // 1. Validate dữ liệu đầu vào
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
    // 1.5. KIỂM TRA TÍNH DUY NHẤT CỦA SĐT
    // =======================================================
    try {
        const existingPhone = await prisma.user.findUnique({
            where: { phone },
        });

        if (existingPhone) {
            return { 
                success: false, 
                fieldErrors: { phone: ['Số điện thoại này đã được sử dụng.'] },
                formError: null 
            };
        }
    } catch (dbError) {
        console.error('Lỗi kiểm tra SĐT DB:', dbError);
        return { success: false, formError: 'Lỗi hệ thống khi kiểm tra dữ liệu.' };
    }

    // =======================================================
    // [MỚI] 1.6. XÁC ĐỊNH ROLE (ADMIN ĐẦU TIÊN)
    // =======================================================
    let newRole: 'ADMIN' | 'USER' = 'USER';
    
    try {
        // Kiểm tra xem đã có bất kỳ Admin nào trong hệ thống chưa
        const existingAdmin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        // Nếu chưa có ai là ADMIN, người này sẽ là ADMIN
        if (!existingAdmin) {
            newRole = 'ADMIN';
        }
    } catch (error) {
        console.error("Lỗi kiểm tra role admin:", error);
        // Nếu lỗi check, mặc định an toàn là USER
        newRole = 'USER';
    }
    
    // =======================================================
    // 2. Tạo User bên Supabase Auth
    // =======================================================
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            // [CẬP NHẬT] Sử dụng biến newRole
            data: { fullName: name, phone, role: newRole }, 
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email`,
        },
    });

    if (error) {
        console.error('Lỗi đăng ký Supabase Auth:', error.message);
        return { success: false, formError: "Có lỗi xảy ra trong lúc đăng ký!" };
    }

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
        await prisma.user.create({
            data: {
                id: data.user.id,
                email: email,
                phone: phone?.toString() || '',
                fullName: name,
                passwordHash: 'supabase_managed', 
                role: newRole, // [CẬP NHẬT] Lưu role tương ứng vào DB
                avatarUrl: null,
                credits: 5,
            },
        });
        
    } catch (dbError: any) {
        console.error('Lỗi tạo profile DB:', dbError);
        
        // Rollback: Xóa user bên Supabase nếu lưu DB thất bại
        await supabase.auth.admin.deleteUser(data.user.id); 
        
        return { 
            success: false, 
            formError: 'Đăng ký thành công nhưng lỗi khởi tạo hồ sơ. Vui lòng liên hệ CSKH.' 
        };
    }

    return { 
        success: true, 
        message: newRole === 'ADMIN' 
            ? 'Đăng ký Admin thành công! Vui lòng kiểm tra email.' 
            : 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.' 
    };
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
  const redirectTo = formData.get('redirectTo')?.toString();
  // LOGIC REDIRECT THÔNG MINH
  if (dbUser?.role === 'ADMIN') {
    redirect('/admin');
  } else if (dbUser?.role === 'BARBER') {
    // Thợ vẫn được coi là USER thường trong logic redirect của middleware nếu không có trang dành riêng
    redirect(redirectTo || '/home'); // Quay lại nơi họ muốn, hoặc mặc định là /home
  } else {
    // User thường
    // Ưu tiên redirect về trang mà họ bị chặn trước đó (ví dụ: /queue)
    redirect(redirectTo || '/home');
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