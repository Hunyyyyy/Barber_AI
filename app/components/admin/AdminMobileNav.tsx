// components/admin/AdminMobileNav.tsx
"use client";

import { logoutAction } from "@/actions/auth.actions";
import ActiveLink from "@/components/layout/ActiveLink";
import { Home, Loader2, LogOut, Scissors, Settings, Users } from "lucide-react";
import { useTransition } from "react";

const navItems = [
  { href: '/admin', label: 'Cài đặt', icon: Settings },
  { href: '/admin/services', label: 'Dịch vụ', icon: Scissors },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/home', label: 'Trang chủ', icon: Home },
];

export default function AdminMobileNav() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    if(confirm('Đăng xuất khỏi trang quản trị?')) {
        startTransition(async () => {
             await logoutAction();
        });
    }
  };

  return (
    // SỬA: bg-card/90, border-border
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t border-border z-50 pb-safe transition-colors duration-300">
      <div className="flex justify-around items-center px-2 py-3">
        {navItems.map((item) => (
          <ActiveLink key={item.href} href={item.href} exact={item.href === '/admin'}>
            {(isActive) => (
              <div className={`flex flex-col items-center gap-1 min-w-[64px] rounded-xl transition-all ${
                // SỬA: isActive -> text-primary, inactive -> text-muted-foreground
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}>
                {/* SỬA: bg-accent nếu active */}
                <div className={`p-1.5 rounded-full ${isActive ? 'bg-accent' : ''}`}>
                    <item.icon className={`w-5 h-5 ${isActive ? 'stroke-2' : 'stroke-[1.5]'}`} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              </div>
            )}
          </ActiveLink>
        ))}
        
        {/* Nút Logout */}
        <button 
            onClick={handleLogout}
            disabled={isPending}
            // SỬA: text-destructive
            className="flex flex-col items-center gap-1 min-w-[64px] text-destructive hover:opacity-80 transition-all rounded-xl"
        >
             <div className="p-1.5">
                {isPending ? <Loader2 className="w-5 h-5 animate-spin"/> : <LogOut className="w-5 h-5 stroke-[1.5]" />}
             </div>
             <span className="text-[10px] font-bold uppercase tracking-wider">Thoát</span>
        </button>
      </div>
    </div>
  );
}