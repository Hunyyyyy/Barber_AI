// app/(admin)/admin/layout.tsx

import AdminLogoutButton from '@/components/admin/AdminLogoutButton';
import AdminMobileNav from '@/components/admin/AdminMobileNav';
import AdminSidebarNav from '@/components/admin/AdminSidebarNav'; // <--- Import mới
import { prisma } from '@/lib/supabase/prisma/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NextTopLoader from 'nextjs-toploader';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');
  
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (dbUser?.role !== 'ADMIN') redirect('/');

  // [ĐÃ XÓA] navItems cũ ở đây vì đã chuyển sang AdminSidebarNav

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row transition-colors duration-300">
      <NextTopLoader 
        color="#000000"
        showSpinner={false}
        zIndex={1600}
      />

      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="w-64 bg-card border-r border-border fixed h-full hidden md:flex flex-col z-10">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-black text-foreground">ADMIN PANEL</h1>
        </div>
        
        {/* [THAY THẾ] Sử dụng Component Client Side để hỗ trợ ActiveLink */}
        <AdminSidebarNav />

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