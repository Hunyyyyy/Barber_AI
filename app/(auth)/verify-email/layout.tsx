import React from 'react';

// Bố cục (Layout) cho trang xác thực thành công
const SuccessLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    // Thiết lập bố cục full-screen, căn giữa nội dung theo chiều dọc và ngang
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      {children}
    </div>
  );
};

export default SuccessLayout;

// Lưu ý:
// Nếu bạn muốn sử dụng layout chung (app/layout.tsx) của trang web
// mà không cần tạo layout riêng cho thư mục này, bạn có thể bỏ qua file này.
// Tuy nhiên, layout này giúp đảm bảo trang xác thực luôn được căn giữa.