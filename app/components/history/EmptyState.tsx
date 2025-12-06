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
    <div className="text-center py-16 border-2 border-dashed border-neutral-100 rounded-3xl bg-neutral-50/50">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-200 shadow-sm">
            <Clock className="w-6 h-6 text-neutral-300" />
        </div>
        <h3 className="font-bold text-lg text-neutral-900 mb-1">{title}</h3>
        <p className="text-neutral-500 text-sm mb-6">{desc}</p>
        <Link href={href}>
            <button className="px-6 py-2.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-neutral-800 transition">
                {btn}
            </button>
        </Link>
    </div>
  );
}