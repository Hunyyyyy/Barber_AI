// components/queue/SuccessScreen.tsx
'use client';

import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SuccessScreen() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
      <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6 shadow-lg">
        <Check className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Đăng ký thành công!</h2>
      <p className="text-gray-500 mb-8 max-w-xs">
        Số thứ tự của bạn đã được thêm vào hàng đợi. Vui lòng đến đúng giờ.
      </p>
      <button
        onClick={() => router.push('/queue/my-ticket')}
        className="bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-800 transition-all shadow-lg w-full max-w-xs"
      >
        Xem số của tôi
      </button>
    </div>
  );
}