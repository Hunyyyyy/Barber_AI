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
      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition font-medium mt-auto"
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