import { FlatCompat } from '@eslint/eslintrc';
import { defineConfig } from "eslint/config";
import path from 'path';
import { fileURLToPath } from 'url';

// Thiết lập tương thích để đọc cấu hình Next.js cũ
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: {
    // Thêm các plugin mà cấu hình next/core-web-vitals yêu cầu
    plugins: ['@next/next'],
  },
});

const eslintConfig = defineConfig([
  // 1. Cấu hình bỏ qua tệp
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "*.config.js",
      "*.config.mjs",
    ]
  },

  // 2. Tương thích ngược với các cấu hình Next.js
  ...compat.extends('next', 'next/core-web-vitals'),
  ...compat.extends('next/typescript'),
  
]);

export default eslintConfig;