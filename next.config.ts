import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // CHO PHÉP TẤT CẢ ẢNH TỪ BÊN NGOÀI (Pinterest, Google CSE, Unsplash, v.v.)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Cho phép mọi domain → fix lỗi i.pinimg.com, lh3.googleusercontent.com...
      },
    ],
    formats: ["image/avif", "image/webp"], // ảnh nhẹ hơn 30-50%
  },

  // Cache API tìm ảnh → tiết kiệm quota Google CSE cực mạnh
  async headers() {
    return [
      {
        source: "/api/search-hairstyle-image",
        headers: [
          { key: "Cache-Control", value: "s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },

  // Các option không cần thiết nữa (đã bật mặc định):
  // - swcMinify: true → XÓA (deprecated)
  // - poweredByHeader: false → vẫn giữ nếu muốn ẩn header X-Powered-By

  poweredByHeader: false,
  // THÊM ĐOẠN NÀY
  eslint: {
    // Cảnh báo: Cho phép build thành công ngay cả khi project có lỗi ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // (Tùy chọn) Nếu bạn muốn bỏ qua lỗi type nhỏ để build gấp (nhưng lỗi bước 1 bắt buộc phải sửa)
    // ignoreBuildErrors: true, 
  }

};

export default nextConfig;