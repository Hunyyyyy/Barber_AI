import { Scissors } from "lucide-react";
import Link from "next/link";
import NextTopLoader from 'nextjs-toploader';
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex">
      <NextTopLoader 
        color="currentColor"
        showSpinner={false}
      />
      {/* LEFT SIDE: Image / Branding */}
      <div className="hidden lg:flex w-1/2 bg-black relative overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Image Placeholder - Bạn nên thay bằng ảnh thật */}
        <div className="absolute inset-0 bg-neutral-900">
           <img 
             src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop&grayscale" 
             alt="Barber Background" 
             className="w-full h-full object-cover opacity-60"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
        </div>

        {/* Content on top of image */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 text-white hover:opacity-80 transition">
            <div className="w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center">
              <Scissors className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">BarberStyle AI</span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <blockquote className="text-2xl font-medium leading-relaxed">
            "Phong cách không chỉ là kiểu tóc, đó là cách bạn nói với thế giới bạn là ai mà không cần cất lời."
          </blockquote>
          <p className="mt-4 text-neutral-400 font-medium">— Creative Director</p>
        </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-[400px]">
           {children}
        </div>
      </div>
    </div>
  );
}