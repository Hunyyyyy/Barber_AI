// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google"; // ← Font đẹp nhất hiện nay
// Nếu thích Manrope (đẹp hơn cho tiếng Việt):
// import { Manrope } from "next/font/google";

import "./globals.css";

// Font Inter – nhẹ, đẹp, hỗ trợ tiếng Việt tốt
const inter = Inter({
  subsets: ["latin", "latin-ext"], // latin-ext để hiển thị dấu tiếng Việt tốt hơn
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter", // dùng CSS variable nếu cần
});

// Nếu chị thích Manrope (cực đẹp cho app Việt Nam):
// const manrope = Manrope({
//   subsets: ["latin", "latin-ext"],
//   display: "swap",
//   weight: ["400", "500", "600", "700"],
//   variable: "--font-manrope",
// });

export const metadata: Metadata = {
  title: "Barber Shop",
  description: "Ứng dụng đặt lịch cắt tóc hiện đại",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="text-sm antialiased">
      {/* Dùng Inter */}
      <body className={inter.className}>
        {children}
      </body>

      {/* Nếu dùng Manrope thì đổi thành: className={manrope.className} */}
    </html>
  );
}