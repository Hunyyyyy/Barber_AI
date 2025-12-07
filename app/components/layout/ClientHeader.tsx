"use client";

import { logoutAction } from "@/actions/auth.actions";
import { Loader2, Menu, Scissors, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import ActiveLink from "./ActiveLink";

// Component Logout Button
function LogoutButton({
  closeMenu,
  isMobile = false,
}: {
  closeMenu?: () => void;
  isMobile?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
    });
  };

  if (isMobile) {
    return (
      <button
        onClick={handleLogout}
        disabled={isPending}
        // SỬA: border-border, text-red-600
        className="text-2xl font-bold py-4 border-b border-border flex items-center justify-between text-red-600 hover:text-red-500 w-full text-left disabled:opacity-50 cursor-pointer"
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
      // SỬA: hover:bg-red-50 dark:hover:bg-red-900/20
      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
  
  const [mounted, setMounted] = useState(false);

  const isLoggedIn = !!serverUser;
  const userName = serverUser?.user_metadata?.full_name || serverUser?.email?.split('@')[0] || "Khách";
  const role = serverUser?.user_metadata?.role || "USER";
  const avatarUrl = serverUser?.user_metadata?.avatar_url;
  const userInitial = userName.charAt(0).toUpperCase();

  const navItems = useMemo(() => {
    const items = [
      { href: "/home", label: "Trang chủ" },
      { href: "/try-hair", label: "Phân tích kiểu tóc phù hợp" },
      { href: "/queue", label: "Đặt lịch" },
      { href: "/history", label: "Lịch sử & bộ sưu tập" },
    ];
    if (role === "ADMIN") {
      items.push({ href: "/admin", label: "Quản trị" });
    }
    return items;
  }, [role]); 

  useEffect(() => {
    setMounted(true);
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
        // SỬA: bg-background (thay vì bg-white), border-border
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background/95 backdrop-blur-md ${
          scrolled ? "border-b border-border py-3" : "border-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* LOGO */}
          <ActiveLink href="/home" className="group flex items-center gap-3">
            {() => (
              <>
                {/* SỬA: bg-primary, text-primary-foreground */}
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center transition-transform group-hover:rotate-12">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  {/* SỬA: text-foreground */}
                  <h1 className="text-lg font-bold tracking-tight text-foreground leading-none">
                    Dai Barber<span className="text-muted-foreground">Style</span>
                  </h1>
                  {/* SỬA: text-muted-foreground */}
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                    Dai Stylist
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
                    // SỬA: 
                    // Active: bg-primary text-primary-foreground
                    // Inactive: text-muted-foreground hover:bg-muted hover:text-foreground
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
            <div className="hidden md:block">
              {isLoggedIn ? (
                <button
                  onClick={toggleProfileMenu}
                  className="focus:outline-none flex items-center gap-3 group"
                  aria-expanded={isProfileMenuOpen}
                >
                  <div className="text-right hidden lg:block">
                    {/* SỬA: text-foreground, group-hover:text-muted-foreground */}
                    <p className="text-sm font-bold text-foreground leading-none group-hover:text-muted-foreground transition-colors">
                      {userName}
                    </p>
                    {/* SỬA: text-muted-foreground */}
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                      {role}
                    </p>
                  </div>

                  <div
                    // SỬA: border-border, ring-border, bg-muted, text-muted-foreground
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border border-border overflow-hidden ${
                      isProfileMenuOpen
                        ? "ring-2 ring-border"
                        : "group-hover:shadow-md"
                    } ${!avatarUrl ? "bg-muted text-muted-foreground" : ""}`}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-sm">{userInitial}</span>
                    )}
                  </div>
                </button>
              ) : (
                <ActiveLink href="/login">
                  {() => (
                    // SỬA: bg-primary text-primary-foreground hover:opacity-90
                    <div className="px-4 py-2 rounded-xl text-sm font-bold transition-all bg-primary text-primary-foreground hover:opacity-90 cursor-pointer">
                      Đăng nhập
                    </div>
                  )}
                </ActiveLink>
              )}
            </div>

            {/* PROFILE DROPDOWN */}
            {isLoggedIn && isProfileMenuOpen && (
              // SỬA: bg-popover, border-border, text-popover-foreground
              <div
                onMouseLeave={closeProfileMenu}
                className="absolute right-0 top-14 w-48 bg-popover border border-border rounded-xl shadow-lg z-50 p-1 animate-in fade-in slide-in-from-top-1 duration-200"
              >
                <ActiveLink href="/profile" onClick={closeProfileMenu}>
                  {() => (
                    // SỬA: text-foreground hover:bg-muted
                    <div className="px-4 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors font-medium">
                      Profile
                    </div>
                  )}
                </ActiveLink>
                <ActiveLink href="/settings" onClick={closeProfileMenu}>
                  {() => (
                    <div className="px-4 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors">
                      Cài đặt
                    </div>
                  )}
                </ActiveLink>
                {/* SỬA: bg-border */}
                <div className="h-px my-1 bg-border" />
                <LogoutButton />
              </div>
            )}

            {/* MOBILE MENU BUTTON */}
            <button onClick={toggleMenu} className="md:hidden p-2 text-foreground" aria-label="Menu">
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      {mounted && open && createPortal(
        // SỬA: bg-background text-foreground
        <div className="fixed inset-0 z-[100] bg-background text-foreground pt-24 px-6 md:hidden animate-in fade-in slide-in-from-top-5 duration-200">
          
          <button 
             onClick={closeMenu} 
             // SỬA: bg-muted text-foreground
             className="absolute top-6 right-6 p-2 bg-muted rounded-full md:hidden"
          >
             <X className="w-6 h-6" />
          </button>

          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <ActiveLink key={item.href} href={item.href}>
                {(isActive) => (
                  // SỬA: border-border, active: text-primary, inactive: text-muted-foreground
                  <div
                    onClick={closeMenu}
                    className={`text-2xl font-bold py-4 border-b border-border flex items-center justify-between ${
                      isActive ? "text-primary pl-4" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                    {/* SỬA: bg-primary */}
                    {isActive && <div className="w-2 h-2 bg-primary rounded-full" />}
                  </div>
                )}
              </ActiveLink>
            ))}

            {/* SỬA: bg-border */}
            <div className="h-px my-2 bg-border" />

            {isLoggedIn ? (
              <>
                <ActiveLink href="/profile">
                  {(isActive) => (
                    <div
                      onClick={closeMenu}
                      className={`text-2xl font-bold py-4 border-b border-border flex items-center justify-between ${
                        isActive ? "text-primary pl-4" : "text-muted-foreground"
                      }`}
                    >
                      Profile
                      {isActive && <div className="w-2 h-2 bg-primary rounded-full" />}
                    </div>
                  )}
                </ActiveLink>
                <ActiveLink href="/settings">
                  {(isActive) => (
                    <div
                      onClick={closeMenu}
                      className={`text-2xl font-bold py-4 border-b border-border flex items-center justify-between ${
                        isActive ? "text-primary pl-4" : "text-muted-foreground"
                      }`}
                    >
                      Cài đặt
                      {isActive && <div className="w-2 h-2 bg-primary rounded-full" />}
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
                      className={`text-2xl font-bold py-4 border-b border-border flex items-center justify-between ${
                        isActive ? "text-primary pl-4" : "text-muted-foreground"
                      }`}
                    >
                      Đăng nhập
                      {isActive && <div className="w-2 h-2 bg-primary rounded-full" />}
                    </div>
                  )}
                </ActiveLink>
                <ActiveLink href="/register">
                  {(isActive) => (
                    <div
                      onClick={closeMenu}
                      className={`text-2xl font-bold py-4 border-b border-border flex items-center justify-between ${
                        isActive ? "text-primary pl-4" : "text-muted-foreground"
                      }`}
                    >
                      Đăng ký
                      {isActive && <div className="w-2 h-2 bg-primary rounded-full" />}
                    </div>
                  )}
                </ActiveLink>
              </>
            )}
          </nav>
        </div>,
        document.body
      )}
    </>
  );
}