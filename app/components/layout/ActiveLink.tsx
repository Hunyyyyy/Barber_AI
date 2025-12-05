"use client";

import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

type ActiveLinkProps = LinkProps & {
  children: (isActive: boolean) => React.ReactNode;
  className?: string;
  exact?: boolean;
};

export default function ActiveLink({
  children,
  className = "",
  exact = false,
  ...props
}: ActiveLinkProps) {
  const pathname = usePathname();

  const isActive = useMemo(() => {
    const href = typeof props.href === "string" 
      ? props.href 
      : (props.href as any)?.pathname || "";
    
    if (exact) return pathname === href;
    if (href === "/") return pathname === href;
    return pathname === href || pathname?.startsWith(href + "/");
  }, [pathname, props.href, exact]);

  return (
    <Link {...props} className={className} data-active={isActive}>
      {children(isActive)}
    </Link>
  );
}