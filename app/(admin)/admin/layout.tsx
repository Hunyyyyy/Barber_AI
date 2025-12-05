// app/(admin)/admin/layout.tsx
import { prisma } from '@/lib/supabase/prisma/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Scissors, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import NextTopLoader from 'nextjs-toploader';
// 1. Import nút đăng xuất vừa tạo
import AdminLogoutButton from '@/components/admin/AdminLogoutButton';

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
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <NextTopLoader 
        color="#000000"
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px #2299DD,0 0 5px #2299DD"
        zIndex={1600}
      />

      {/* 2. Thêm flex flex-col để căn chỉnh layout dọc */}
      <aside className="w-64 bg-white border-r border-gray-200 fixed h-full hidden md:flex flex-col z-10">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-black text-black">ADMIN PANEL</h1>
        </div>
        
        {/* Phần menu chính */}
        <nav className="p-4 space-y-2 flex-1">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition font-medium"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* 3. Phần chân Sidebar chứa nút Logout */}
        <div className="p-4 border-t border-gray-100">
            <AdminLogoutButton />
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-8">
        {children}
      </main>
    </div>
  );
}