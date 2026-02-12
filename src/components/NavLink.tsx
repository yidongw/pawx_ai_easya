'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type NavLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  default?: boolean;
};

export const NavLink = ({ href, children, className = '', default: isDefault = false }: NavLinkProps) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial render, don't apply active styles to prevent hydration mismatch
  const isActive = mounted && (
    isDefault
      ? (pathname === '/' || pathname === href)
      : pathname === href || pathname.startsWith(`${href}/`)
  );

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 hover:opacity-65 ${className} ${
        isActive ? 'text-orange-700 dark:text-orange-400' : ''
      }`}
    >
      {children}
    </Link>
  );
};
