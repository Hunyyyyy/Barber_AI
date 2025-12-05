import { getUserInfo } from '@/actions/user.actions'; // File user.actions.ts bạn đã gửi
import ProfileContent from '@/components/profile/ProfileContent';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  // 1. Lấy thông tin user từ Server Action
  const user = await getUserInfo();

  // 2. Nếu chưa đăng nhập, đá về trang login
  if (!user) {
    redirect('/auth/login');
  }

  // 3. Truyền dữ liệu xuống Client Component
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-6 text-gray-900">Hồ sơ cá nhân</h1>
        <ProfileContent user={user} />
      </div>
    </div>
  );
}