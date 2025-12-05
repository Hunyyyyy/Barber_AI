"use client";

import { registerAction } from "@/actions/auth.actions";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
// === Type Guards và Type Definitions ===

// Định nghĩa các khóa hợp lệ cho Field Errors
type ValidFieldKey = 'name' | 'email' | 'phone' | 'password';

// Định nghĩa kiểu dữ liệu cho Field Errors để Type Guard hoạt động
type FieldErrors = {
    [key in ValidFieldKey]?: string[];
};

// ======================================

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full py-3 px-4 bg-black text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
    >
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo tài khoản"}
    </button>
  );
}

export default function RegisterPage() {
    // @ts-ignore ReactDOM.useFormState has been renamed – ignore in React 18
    const [state, formAction] = useActionState(registerAction, null);

    // Hàm tiện ích để hiển thị lỗi cho một trường cụ thể
    // Đã giới hạn kiểu của fieldName để fix TS 7053
    const getFieldError = (fieldName: ValidFieldKey) => {
    return fieldErrors?.[fieldName]?.[0] ?? null;
};

    // Lấy lỗi chung (sử dụng Type Guard để fix lỗi TS 2339)
    const fieldErrors = state?.fieldErrors ?? {};
    const generalError = state?.formError ?? null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Tạo tài khoản mới</h1>
        <p className="text-neutral-500">Bắt đầu hành trình định hình phong cách của bạn</p>
      </div>

      {/* Hiển thị lỗi chung (nếu có) */}
      {generalError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
            <span className="block sm:inline">{generalError}</span>
        </div>
      )}
      {/* Hiển thị thông báo thành công (nếu có) */}
      {state?.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl relative" role="alert">
            <span className="block sm:inline">{state.message}</span>
        </div>
      )}
      

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Họ và Tên</label>
            <input 
              name="name" type="text" placeholder="Nguyễn Văn A" required
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
            />
            {/* Hiển thị lỗi cho trường name */}
            {getFieldError('name') && (
                <p className="text-xs text-red-600 mt-1">{getFieldError('name')}</p>
            )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Số điện thoại</label>
                <input 
                  name="phone" type="tel" placeholder="0912..." required
                  className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all "
                />
                {/* Hiển thị lỗi cho trường phone */}
                {getFieldError('phone') && (
                    <p className="text-xs text-red-600 mt-1">{getFieldError('phone')}</p>
                )}
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Email</label>
                <input 
                  name="email" type="email" placeholder="email@..." required
                  className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                />
                {/* Hiển thị lỗi cho trường email */}
                {getFieldError('email') && (
                    <p className="text-xs text-red-600 mt-1">{getFieldError('email')}</p>
                )}
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Mật khẩu</label>
            <input 
              name="password" type="password" placeholder="Tối thiểu 6 ký tự" required
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
            />
            {/* Hiển thị lỗi cho trường password */}
            {getFieldError('password') && (
                <p className="text-xs text-red-600 mt-1">{getFieldError('password')}</p>
            )}
        </div>

        <div className="pt-2">
            <SubmitButton />
        </div>
      </form>

      <p className="text-center text-sm text-neutral-500">
        Đã có tài khoản? <Link href="/login" className="font-bold text-neutral-900 hover:underline">Đăng nhập</Link>
      </p>
    </div>
  );
}