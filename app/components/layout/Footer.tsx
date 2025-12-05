"use client";

import { Facebook, Instagram, Mail, Scissors } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-black text-white pt-16 pb-8 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white text-black rounded flex items-center justify-center">
                <Scissors className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight">BarberStyle AI</span>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Công nghệ AI định hình phong cách phái mạnh. Tìm kiếm kiểu tóc hoàn hảo của bạn ngay hôm nay.
            </p>
          </div>

          {/* Columns */}
          <div>
            <h4 className="font-bold text-sm mb-4">Khám phá</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><Link href="/suggest" className="hover:text-white transition">Gợi ý AI</Link></li>
              <li><Link href="/try-hair" className="hover:text-white transition">Thử tóc ảo</Link></li>
              <li><Link href="/hairstyles" className="hover:text-white transition">Thư viện</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-neutral-400">
              <li><Link href="/about" className="hover:text-white transition">Về chúng tôi</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Liên hệ</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">Điều khoản</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold text-sm mb-4">Kết nối</h4>
            <div className="flex gap-4">
              {[Instagram, Facebook, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-white hover:text-black hover:border-white transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} BarberStyle AI. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-neutral-300">Privacy</Link>
            <Link href="/cookies" className="hover:text-neutral-300">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}