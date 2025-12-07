// components/admin/AdminSidebarNav.tsx
"use client";

import ActiveLink from "@/components/layout/ActiveLink";
import { Home, Scissors, Settings, Users } from "lucide-react";

// Định nghĩa danh sách menu tại đây
const navItems = [
  { name: 'Cài đặt chung', href: '/admin', icon: Settings },
  { name: 'Quản lý Dịch vụ', href: '/admin/services', icon: Scissors },
  { name: 'Phân quyền User', href: '/admin/users', icon: Users },
  { name: 'Trang chủ', href: '/home', icon: Home },
];

export default function AdminSidebarNav() {
  return (
    <nav className="p-4 space-y-2 flex-1">
      {navItems.map((item) => (
        <ActiveLink 
          key={item.href} 
          href={item.href} 
          exact={item.href === '/admin'} // Active chính xác cho trang chủ admin
        >
          {(isActive) => (
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive
                  // Style khi Active: Màu nền Primary, chữ trắng/đen tùy theme, bóng mờ
                  ? "bg-primary text-primary-foreground shadow-md"
                  // Style khi Inactive: Chữ mờ, hover vào hiện nền nhẹ
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "animate-pulse" : ""}`} />
              {item.name}
            </div>
          )}
        </ActiveLink>
      ))}
    </nav>
  );
}