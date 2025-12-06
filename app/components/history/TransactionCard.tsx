'use client';

import { formatCurrency } from '@/lib/utils';
import { Coins } from 'lucide-react';

export default function TransactionCard({ item }: { item: any }) {
    const isSuccess = item.status === 'PAID';
    return (
        <div className="flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-2xl hover:bg-neutral-50 transition">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isSuccess ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-300 border-neutral-200'}`}>
                    <Coins className="w-4 h-4" />
                </div>
                <div>
                    <p className="font-bold text-sm text-neutral-900">Nạp Credit ({item.code})</p>
                    <p className="text-xs text-neutral-500">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-black text-sm ${isSuccess ? 'text-neutral-900' : 'text-neutral-300'}`}>
                    +{item.credits} Credits
                </p>
                <p className="text-xs text-neutral-500 font-medium">
                    -{formatCurrency(item.amount)}
                </p>
            </div>
        </div>
    )
}