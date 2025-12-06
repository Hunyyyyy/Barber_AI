"use client";

import { CalendarCheck2, ChevronLeft, ChevronRight, History, Home, Scissors, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import ActiveLink from "./ActiveLink";
interface LeftSideBarProps {
  role?: string | null;
}


export default function LeftSideBar({ role }: LeftSideBarProps) {
    const [collapsed, setCollapsed] = useState(true);
const navItems = useMemo(() => {
    const items = [
      { href: "/home", label: "Trang Chủ", icon: Home },
      { href: "/try-hair", label: "Phân tích tóc", icon: Sparkles },
      { href: "/queue", label: "Đặt lịch", icon: CalendarCheck2 },
      { href: "/history", label: "Lịch sử", icon: History },
    ];

    // Kiểm tra nếu là ADMIN thì thêm vào mảng
    // Lưu ý: Chuỗi 'ADMIN' phải khớp với giá trị trong Database của bạn (viết hoa/thường)
    if (role === "ADMIN") {
      items.push({ 
        href: "/admin", 
        label: "Quản trị", 
        icon: ShieldCheck 
      });
    }

    return items;
  }, [role]);
  return (
    <aside
      className={`hidden md:flex flex-col h-[calc(100vh-80px)] sticky top-20 z-40 bg-white text-neutral-900 border-r border-neutral-200 transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex-1 py-6 px-3 space-y-2">
        {/* Render danh sách items đã tính toán ở trên */}
        {navItems.map((item) => (
          <ActiveLink key={item.href} href={item.href}>
            {(isActive) => (
              <div
                className={`z-50 group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-black text-white shadow-lg shadow-neutral-200"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-black"
                }`}
              >
                <div className={`relative flex items-center justify-center transition-all ${collapsed ? "w-full" : ""}`}>
                  <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-current"}`} />
                  
                  {collapsed && (
                    <div className="absolute left-full ml-4 px-3 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                      {item.label}
                    </div>
                  )}
                </div>
                
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                )}
              </div>
            )}
          </ActiveLink>
        ))}
      </div>

      {/* FOOTER AREA */}
      <div className="p-3 border-t border-neutral-100 space-y-2 cursor-pointer">
         {/* Premium Banner Small */}
        <div className={`rounded-xl bg-neutral-50 p-3 flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                <Scissors className="w-4 h-4 text-neutral-600"/>
            </div>
            {!collapsed && (
                <div className="overflow-hidden">
                    <p className="text-xs font-bold text-neutral-900">Premium</p>
                    <p className="text-[10px] text-neutral-500 truncate">Unlock all styles</p>
                </div>
            )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-black transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}