// components/admin/AdminLogoutButton.tsx
"use client";

import { logoutAction } from "@/actions/auth.actions";
import { Loader2, LogOut } from "lucide-react";
import { useTransition } from "react";

export default function AdminLogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      // SỬA: text-destructive hover:bg-destructive/10 để hỗ trợ dark mode tốt hơn
      className="w-full flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-xl transition font-medium mt-auto"
    >
      {isPending ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <LogOut className="w-5 h-5" />
      )}
      {isPending ? "Đang đăng xuất..." : "Đăng xuất"}
    </button>
  );
}