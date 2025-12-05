// postcss.config.mjs
/** @type {import('postcss').Postcss} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},  // ← Thay đổi ở đây
    autoprefixer: {},
  },
};

export default config;