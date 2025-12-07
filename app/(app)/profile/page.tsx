// app/profile/page.tsx
'use client';

// Vẫn giữ dòng này để đảm bảo không bị cache sai data
export const dynamic = 'force-dynamic';

import { getUserInfo } from '@/actions/user.actions';
import ProfileContent from '@/components/profile/ProfileContent';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userData = await getUserInfo();
        
        if (!userData) {
          // Nếu không tìm thấy user, đá về trang login
          // Lưu ý: Kiểm tra lại đường dẫn login của bạn là '/login' hay '/auth/login'
          router.push('/login'); 
          return;
        }

        setUser(userData);
      } catch (error) {
        console.error("Lỗi lấy thông tin profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // 1. Màn hình Loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-foreground" />
        <p className="text-muted-foreground font-medium animate-pulse">Đang tải hồ sơ...</p>
      </div>
    );
  }

  // 2. Nếu đã load xong mà không có user (thường sẽ bị redirect ở trên rồi, đây là dự phòng)
  if (!user) return null;

  // 3. Render giao diện chính
  return (
    <div className="min-h-screen bg-background py-8 px-4 transition-colors duration-300 animate-in fade-in zoom-in duration-500">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-6 text-foreground">Hồ sơ cá nhân</h1>
        <ProfileContent user={user} />
      </div>
    </div>
  );
}