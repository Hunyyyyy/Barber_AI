"use client";

import { logoutAction } from "@/actions/auth.actions";
import { Loader2, Menu, Scissors, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import ActiveLink from "./ActiveLink";

const navItems = [
  { href: "/home", label: "Trang chủ" },
  { href: "/try-hair", label: "Phân tích kiểu tóc phù hợp" },
  { href: "//queue", label: "Đặt lịch" },
  { href: "/home", label: "About" },
] as const;

function LogoutButton({
  closeMenu,
  isMobile = false,
}: {
  closeMenu?: () => void;
  isMobile?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLogout = () => {
  startTransition(async () => {
    const result = await logoutAction();
    // logoutAction giờ đã signOut thật → session mất ngay
  });
};

  if (isMobile) {
    return (
      <button
        onClick={handleLogout}
        disabled={isPending}
        className="text-2xl font-bold py-4 border-b border-neutral-100 flex items-center justify-between text-red-600 w-full text-left disabled:opacity-50 cursor-pointer"
      >
        <span>{isPending ? "Đang đăng xuất..." : "Đăng xuất"}</span>
        {isPending && <Loader2 className="w-5 h-5 animate-spin" />}
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-2 cursor-pointer"
    >
      {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
      {isPending ? "Đang đăng xuất..." : "Đăng xuất"}
    </button>
  );
}

export default function ClientHeader({ serverUser }: { serverUser: any }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Dùng thẳng serverUser → luôn đồng bộ với server, không cần state riêng
  const isLoggedIn = !!serverUser;
  // Lấy tên từ metadata, nếu không có thì fallback về email hoặc "Khách"
  const userName = serverUser?.user_metadata?.name || serverUser?.email?.split('@')[0] || "Khách";
  const role = serverUser?.user_metadata?.role || "USER";
  // Lấy chữ cái đầu để làm Avatar
  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = useCallback(() => setOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => {
    setOpen(false);
    setIsProfileMenuOpen(false);
  }, []);

  const toggleProfileMenu = useCallback(() => setIsProfileMenuOpen((prev) => !prev), []);
  const closeProfileMenu = useCallback(() => setIsProfileMenuOpen(false), []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${
          scrolled ? "border-b border-neutral-200 py-3" : "border-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* LOGO */}
          <ActiveLink href="/" className="group flex items-center gap-3">
            {() => (
              <>
                <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center transition-transform group-hover:rotate-12">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-neutral-900 leading-none">
                    Barber<span className="text-neutral-500">Style</span>
                  </h1>
                  <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest">
                    AI Stylist
                  </p>
                </div>
              </>
            )}
          </ActiveLink>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <ActiveLink key={item.href} href={item.href}>
                {(isActive) => (
                  <span
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-black text-white shadow-md"
                        : "text-neutral-500 hover:bg-neutral-100 hover:text-black"
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </ActiveLink>
            ))}
          </nav>

          {/* ACTIONS */}
          <div className="flex items-center gap-3 relative">
            {/* DESKTOP PROFILE / LOGIN */}
            <div className="hidden md:block">
              {isLoggedIn ? (
                <button
                  onClick={toggleProfileMenu}
                  className="focus:outline-none flex items-center gap-3 group" // Thêm flex và gap để căn chỉnh tên + avatar
                  aria-expanded={isProfileMenuOpen}
                >
                  {/* --- PHẦN THÊM MỚI: HIỂN THỊ TÊN --- */}
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-bold text-neutral-900 leading-none group-hover:text-neutral-600 transition-colors">
                      {userName}
                    </p>
                    <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider mt-0.5">
                      {role}
                    </p>
                  </div>
                  {/* ----------------------------------- */}

                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border border-neutral-200 ${
                      isProfileMenuOpen
                        ? "bg-black text-white ring-2 ring-neutral-200"
                        : "bg-neutral-50 text-neutral-900 group-hover:bg-white group-hover:shadow-md"
                    }`}
                  >
                    {/* Hiển thị ký tự đầu của tên thay vì icon User đơn điệu */}
                    <span className="font-bold text-sm">{userInitial}</span>
                  </div>
                </button>
              ) : (
                <ActiveLink href="/login">
                  {() => (
                    <div className="px-4 py-2 rounded-xl text-sm font-bold transition-all bg-black text-white hover:bg-neutral-800 cursor-pointer">
                      Đăng nhập
                    </div>
                  )}
                </ActiveLink>
              )}
            </div>

            {/* PROFILE DROPDOWN */}
            {isLoggedIn && isProfileMenuOpen && (
              <div
                onMouseLeave={closeProfileMenu}
                className="absolute right-0 top-14 w-48 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 p-1 animate-in fade-in slide-in-from-top-1 duration-200"
              >
                <ActiveLink href="/profile" onClick={closeProfileMenu}>
                  {() => (
                    <div className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors font-medium">
                      Profile
                    </div>
                  )}
                </ActiveLink>
                <ActiveLink href="/settings" onClick={closeProfileMenu}>
                  {() => (
                    <div className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors">
                      Cài đặt
                    </div>
                  )}
                </ActiveLink>
                <div className="h-px my-1 bg-neutral-100" />
                <LogoutButton closeMenu={closeProfileMenu} />
              </div>
            )}

            {/* MOBILE MENU BUTTON */}
            <button onClick={toggleMenu} className="md:hidden p-2 text-neutral-900" aria-label="Menu">
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      {open && (
        <div className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden animate-in fade-in slide-in-from-top-5 duration-200">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <ActiveLink key={item.href} href={item.href}>
                {(isActive) => (
                  <div
                    onClick={closeMenu}
                    className={`text-2xl font-bold py-4 border-b border-neutral-100 flex items-center justify-between ${
                      isActive ? "text-black pl-4" : "text-neutral-400"
                    }`}
                  >
                    {item.label}
                    {isActive && <div className="w-2 h-2 bg-black rounded-full" />}
                  </div>
                )}
              </ActiveLink>
            ))}

            <div className="h-px my-2 bg-neutral-100" />

            {isLoggedIn ? (
              <>
                <ActiveLink href="/profile">
                  {(isActive) => (
                    <div
                      onClick={closeMenu}
                      className={`text-2xl font-bold py-4 border-b border-neutral-100 flex items-center justify-between ${
                        isActive ? "text-black pl-4" : "text-neutral-400"
                      }`}
                    >
                      Profile
                      {isActive && <div className="w-2 h-2 bg-black rounded-full" />}
                    </div>
                  )}
                </ActiveLink>
                <ActiveLink href="/settings">
                  {(isActive) => (
                    <div
                      onClick={closeMenu}
                      className={`text-2xl font-bold py-4 border-b border-neutral-100 flex items-center justify-between ${
                        isActive ? "text-black pl-4" : "text-neutral-400"
                      }`}
                    >
                      Cài đặt
                      {isActive && <div className="w-2 h-2 bg-black rounded-full" />}
                    </div>
                  )}
                </ActiveLink>
                <LogoutButton closeMenu={closeMenu} isMobile />
              </>
            ) : (
              <>
                <ActiveLink href="/login">
                  {(isActive) => (
                    <div
                      onClick={closeMenu}
                      className={`text-2xl font-bold py-4 border-b border-neutral-100 flex items-center justify-between ${
                        isActive ? "text-black pl-4" : "text-neutral-400"
                      }`}
                    >
                      Đăng nhập
                      {isActive && <div className="w-2 h-2 bg-black rounded-full" />}
                    </div>
                  )}
                </ActiveLink>
                <ActiveLink href="/register">
                  {(isActive) => (
                    <div
                      onClick={closeMenu}
                      className={`text-2xl font-bold py-4 border-b border-neutral-100 flex items-center justify-between ${
                        isActive ? "text-black pl-4" : "text-neutral-400"
                      }`}
                    >
                      Đăng ký
                      {isActive && <div className="w-2 h-2 bg-black rounded-full" />}
                    </div>
                  )}
                </ActiveLink>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}