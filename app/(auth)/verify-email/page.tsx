import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailSuccessPage() {
  return (
    // Sử dụng hiệu ứng chuyển động và căn lề giống như trang Đăng nhập
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 text-center">
      <div className="space-y-4">
        {/* Icon lớn thể hiện sự thành công */}
        <div className="flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Xác Thực Thành Công!
        </h1>
        
        <p className="text-neutral-500">
          Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay bây giờ.
        </p>
      </div>

      <div className="pt-2">
        {/* Nút quay lại trang Đăng nhập, thiết kế giống nút Submit */}
        <Link href="/login" passHref legacyBehavior>
          <a
            className="w-full py-3 px-4 bg-black text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Quay lại Đăng nhập
          </a>
        </Link>
      </div>
      
      {/* Thông báo phụ (tùy chọn) */}
      <p className="text-center text-sm text-neutral-500 pt-4">
        Nếu có bất kỳ vấn đề nào, vui lòng liên hệ bộ phận hỗ trợ.
      </p>
    </div>
  );
}