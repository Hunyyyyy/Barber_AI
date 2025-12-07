"use client";

import { registerAction } from "@/actions/auth.actions";
import { CheckCircle, Loader2, Mail } from "lucide-react"; // Import thêm icon
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

// === Type Guards và Type Definitions ===
type ValidFieldKey = 'name' | 'email' | 'phone' | 'password';

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

    const getFieldError = (fieldName: ValidFieldKey) => {
        // @ts-ignore
        return state?.fieldErrors?.[fieldName]?.[0] ?? null;
    };

    // @ts-ignore
    const generalError = state?.formError ?? null;

    // === PHẦN SỬA ĐỔI QUAN TRỌNG: GIAO DIỆN THÀNH CÔNG ===
    // Nếu đăng ký thành công, hiển thị giao diện này thay vì form
    // @ts-ignore
    if (state?.success) {
        return (
            <div className="flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500 py-8">
                {/* Icon lớn thu hút sự chú ý */}
                <div className="relative">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                        <Mail className="w-10 h-10" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-full border-4 border-white">
                        <CheckCircle className="w-4 h-4" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Kiểm tra email của bạn</h1>
                    <p className="text-neutral-500 max-w-sm mx-auto text-lg">
                        {/* @ts-ignore */}
                        {state.message}
                    </p>
                </div>

                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 w-full max-w-sm">
                    <p className="text-sm text-neutral-600 mb-3">
                        Không nhận được email? Hãy kiểm tra thư mục Spam hoặc thử lại sau vài phút.
                    </p>
                    <Link 
                        href="/login" 
                        className="block w-full py-3 px-4 bg-black text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition-all text-center"
                    >
                        Quay lại trang đăng nhập
                    </Link>
                </div>
            </div>
        );
    }
    // === KẾT THÚC PHẦN SỬA ĐỔI ===

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Tạo tài khoản mới</h1>
        <p className="text-neutral-500">Bắt đầu hành trình định hình phong cách của bạn</p>
      </div>

      {/* Hiển thị lỗi chung (nếu có) */}
      {generalError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium" role="alert">
            <span className="block sm:inline">{generalError}</span>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Họ và Tên</label>
            <input 
              name="name" type="text" placeholder="Nguyễn Văn A" required
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
            />
            {getFieldError('name') && (
                <p className="text-xs text-red-600 mt-1 font-medium">{getFieldError('name')}</p>
            )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Số điện thoại</label>
                <input 
                  name="phone" type="tel" placeholder="0912..." required
                  className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all "
                />
                {getFieldError('phone') && (
                    <p className="text-xs text-red-600 mt-1 font-medium">{getFieldError('phone')}</p>
                )}
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Email</label>
                <input 
                  name="email" type="email" placeholder="email@..." required
                  className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                />
                {getFieldError('email') && (
                    <p className="text-xs text-red-600 mt-1 font-medium">{getFieldError('email')}</p>
                )}
            </div>
        </div>

        <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Mật khẩu</label>
            <input 
              name="password" type="password" placeholder="Tối thiểu 8 ký tự" required
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
            />
            {getFieldError('password') && (
                <p className="text-xs text-red-600 mt-1 font-medium">{getFieldError('password')}</p>
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