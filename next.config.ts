// next.config.ts
import type { NextConfig } from "next";

// 1. Định nghĩa Content Security Policy (CSP)
// Lưu ý: connect-src cần cho phép process.env.NEXT_PUBLIC_SUPABASE_URL nếu muốn chặt chẽ hơn
// Ở đây mình để https: chung cho connect-src để đảm bảo Supabase và Google Auth hoạt động ổn định.
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' https:; 
    upgrade-insecure-requests;
`;

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Giữ nguyên cấu hình ảnh của bạn
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", 
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Tắt header mặc định tiết lộ công nghệ server
  poweredByHeader: false,

  // Giữ nguyên cấu hình build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ignoreBuildErrors: true, 
  },

  // === CẤU HÌNH HEADERS BẢO MẬT ===
  async headers() {
    return [
      // 1. Cấu hình Cache cho API tìm ảnh (Cũ)
      {
        source: "/api/search-hairstyle-image",
        headers: [
          { key: "Cache-Control", value: "s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
      // 2. Thêm Security Headers cho TOÀN BỘ trang web
      {
        source: "/(.*)", // Áp dụng cho tất cả routes
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""), // Xóa xuống dòng để thành 1 chuỗi
          },
          {
            key: "X-Frame-Options",
            value: "DENY", // Ngăn chặn trang web bị nhúng vào iframe (Chống Clickjacking)
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Ngăn trình duyệt tự đoán MIME type (Chống XSS qua file upload)
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin", // Bảo vệ thông tin referrer khi link sang trang khác
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()", // Chặn quyền truy cập phần cứng nếu không cần thiết (Bạn có dùng Camera ở /try-hair, nên có thể cần điều chỉnh dòng này nếu tính năng camera bị chặn)
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload", // Bắt buộc dùng HTTPS
          }
        ],
      },
    ];
  },
};

export default nextConfig;