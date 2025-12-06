// app/profile/page.tsx
import { getUserInfo } from '@/actions/user.actions';
import ProfileContent from '@/components/profile/ProfileContent';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const user = await getUserInfo();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    // SỬA: bg-background, text-foreground
    <div className="min-h-screen bg-background py-8 px-4 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        {/* SỬA: text-foreground */}
        <h1 className="text-3xl font-black mb-6 text-foreground">Hồ sơ cá nhân</h1>
        <ProfileContent user={user} />
      </div>
    </div>
  );
}