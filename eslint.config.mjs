// eslint.config.mjs (hoặc eslint.config.js)

import { defineConfig, globalIgnores } from "eslint/config";
// THAY ĐỔI TẠI ĐÂY: Thêm .js
import nextVitals from "eslint-config-next/core-web-vitals.js";
// THAY ĐỔI TẠI ĐÂY: Thêm .js
import nextTs from "eslint-config-next/typescript.js";

const eslintConfig = defineConfig([
  // ...nextVitals, // (Xem lưu ý bên dưới)
  // ...nextTs,     // (Xem lưu ý bên dưới)
  
  // Dùng trực tiếp như một đối tượng cấu hình, không cần spread (truyền mảng)
  nextVitals,
  nextTs,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;