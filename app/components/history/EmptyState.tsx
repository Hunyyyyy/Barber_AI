'use client';

import { Clock } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  desc: string;
  href: string;
  btn: string;
}

export default function EmptyState({ title, desc, href, btn }: EmptyStateProps) {
  return (
    // SỬA: bg-muted/20, border-border
    <div className="text-center py-16 border-2 border-dashed border-border rounded-3xl bg-muted/20">
        <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-4 border border-border shadow-sm">
            <Clock className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-bold text-lg text-foreground mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm mb-6">{desc}</p>
        <Link href={href}>
            <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition shadow-lg">
                {btn}
            </button>
        </Link>
    </div>
  );
}