
// lib/supabase/auth.ts
import { createSupabaseServerClient } from './server';

export async function getSession() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}
/**
 * MỚI: Helper lấy Access Token nhanh gọn
 * Dùng khi cần gọi API bên thứ 3
 */
export async function getAccessToken() {
  const session = await getSession();
  return session?.access_token || null;
}

/**
 * MỚI: Helper lấy Header chuẩn Bearer
 * Dùng để spread vào fetch headers: ...await getAuthHeader()
 */
export async function getAuthHeader() {
  const token = await getAccessToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}
