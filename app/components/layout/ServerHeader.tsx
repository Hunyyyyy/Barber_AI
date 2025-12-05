// components/ServerHeader.tsx
import ClientHeader from '@/components/layout/ClientHeader';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function ServerHeader() {
  const supabase = await createSupabaseServerClient();
  
  // Dùng getUser() an toàn hơn getSession() ở phía server
  const { data: { user } } = await supabase.auth.getUser();

  // Truyền user xuống client component
  return <ClientHeader serverUser={user} />;
}