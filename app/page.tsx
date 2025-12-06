import { ArrowRight, Clock, Scissors, Sparkles, UserCircle, Users } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-amber-500 selection:text-black">
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-amber-500">
            <Scissors className="w-8 h-8" />
            <span>BARBER.AI</span>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-300 hover:text-white font-medium transition-colors text-sm sm:text-base">
              Đăng nhập
            </Link>
            <Link href="/register">
              <button className="bg-white text-slate-950 px-4 py-2 rounded-full font-bold hover:bg-slate-200 transition-colors text-sm sm:text-base">
                Đăng ký
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Gradients (Trang trí) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-amber-500/20 rounded-full blur-[120px] -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-amber-400 text-sm mb-6 animate-fade-in-up">
            <Sparkles className="w-4 h-4" />
            <span>Công nghệ AI Visagism độc quyền</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Nâng Tầm Phong Cách <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              Với Một Chạm
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Không chỉ là cắt tóc. Chúng tôi sử dụng AI để tìm ra kiểu tóc hoàn hảo cho khuôn mặt bạn. 
            Đặt chỗ thông minh, không lo chờ đợi.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Nút Chính: Check Queue */}
            <Link href="/queue" className="w-full sm:w-auto">
              <button className="w-full group flex items-center justify-center gap-3 bg-amber-500 text-black px-8 py-4 rounded-xl text-lg font-bold hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                <Clock className="w-5 h-5" />
                Lấy Số & Xem Hàng Chờ
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            
            {/* Nút Phụ: AI Suggestion */}
            <Link href="/hair-analysis" className="w-full sm:w-auto">
              <button className="w-full flex items-center justify-center gap-3 bg-slate-800 text-white border border-slate-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-slate-700 transition-all">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI Tư Vấn Kiểu Tóc
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* --- FEATURE CARDS --- */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: AI */}
          <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl hover:border-amber-500/50 transition-colors group">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-purple-500/20">
              <UserCircle className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Phân Tích Khuôn Mặt AI</h3>
            <p className="text-slate-400">
              Upload ảnh selfie, AI sẽ phân tích Jawline, trán và tỷ lệ khuôn mặt để gợi ý kiểu tóc "chuẩn soái ca".
            </p>
          </div>

          {/* Card 2: Try-On */}
          <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl hover:border-amber-500/50 transition-colors group">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-blue-500/20">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Thử Tóc Trước Khi Cắt</h3>
            <p className="text-slate-400">
              Xem trước diện mạo mới của bạn với công nghệ tạo sinh hình ảnh. Chọn kiểu ưng ý, thợ sẽ cắt y hệt.
            </p>
          </div>

          {/* Card 3: Live Queue */}
          <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl hover:border-amber-500/50 transition-colors group">
            <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-amber-500/20">
              <Users className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Hàng Chờ Thông Minh</h3>
            <p className="text-slate-400">
              Biết chính xác bao nhiêu người đang đợi. Lấy số tại nhà, đến nơi là cắt ngay. Không còn cảnh ngồi đợi mòn mỏi.
            </p>
          </div>

        </div>
      </section>

      {/* --- FOOTER SIMPLIFIED --- */}
      <footer className="py-8 text-center text-slate-600 text-sm border-t border-slate-800">
        <p>© 2024 Barber AI Shop. Mọi quyền được bảo lưu.</p>
      </footer>
    </div>
  );
}