// app/page.tsx (Giả định)
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50">
      
      {/* Thêm hình ảnh hoặc biểu tượng để tạo điểm nhấn */}
      

[Image of modern barber shop logo or scissors icon]

      
      <header className="text-center mb-10">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight tracking-tighter">
          **Barber Shop**
        </h1>
        <p className="mt-2 text-xl text-gray-600 font-medium">
          Đặt lịch cắt tóc, tạo phong cách mới.
        </p>
      </header>

      <main className="w-full max-w-sm text-center">
        
        {/* Nút chính: Đặt lịch ngay */}
        <Link href="/queue">
          <button className="w-full py-4 px-4 bg-indigo-600 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition duration-300 transform hover:scale-[1.02]">
            Đặt Lịch Cắt Tóc Ngay ✂️
          </button>
        </Link>

        {/* Nút phụ: Khám phá kiểu tóc */}
        <Link href="/home" className="block mt-4 text-indigo-600 font-semibold hover:text-indigo-800 transition duration-200">
          ➡️ Khám Phá Các Kiểu Tóc
        </Link>
      </main>
    </div>
  );
}