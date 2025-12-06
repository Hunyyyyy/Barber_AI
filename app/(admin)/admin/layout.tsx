// app/(admin)/admin/layout.tsx

import AdminLogoutButton from '@/components/admin/AdminLogoutButton';
import AdminMobileNav from '@/components/admin/AdminMobileNav';
import { prisma } from '@/lib/supabase/prisma/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Home, Scissors, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import NextTopLoader from 'nextjs-toploader';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');
  
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (dbUser?.role !== 'ADMIN') redirect('/');

  const navItems = [
    { name: 'Cài đặt chung', href: '/admin', icon: Settings },
    { name: 'Quản lý Dịch vụ', href: '/admin/services', icon: Scissors },
    { name: 'Phân quyền User', href: '/admin/users', icon: Users },
    { name: 'Trang chủ', href: '/home', icon: Home },
  ];

  return (
    // SỬA: bg-background thay vì bg-gray-50
    <div className="min-h-screen bg-background flex flex-col md:flex-row transition-colors duration-300">
      <NextTopLoader 
        color="#000000"
        showSpinner={false}
        zIndex={1600}
      />

      {/* --- SIDEBAR DESKTOP --- */}
      {/* SỬA: bg-card, border-border */}
      <aside className="w-64 bg-card border-r border-border fixed h-full hidden md:flex flex-col z-10">
        <div className="p-6 border-b border-border">
          {/* SỬA: text-foreground */}
          <h1 className="text-xl font-black text-foreground">ADMIN PANEL</h1>
        </div>
        
        <nav className="p-4 space-y-2 flex-1">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              // SỬA: text-muted-foreground hover:bg-accent hover:text-accent-foreground
              className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-xl transition font-medium"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
            <AdminLogoutButton />
        </div>
      </aside>

      {/* --- MOBILE NAVIGATION --- */}
      <AdminMobileNav />

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}