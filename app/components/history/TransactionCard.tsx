'use client';

import { formatCurrency } from '@/lib/utils';
import { Coins } from 'lucide-react';

export default function TransactionCard({ item }: { item: any }) {
    const isSuccess = item.status === 'PAID';
    return (
        // SỬA: bg-card, border-border, hover:bg-accent
        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:bg-accent/50 transition duration-200">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border 
                    ${isSuccess 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-muted text-muted-foreground border-border'
                    }
                `}>
                    <Coins className="w-4 h-4" />
                </div>
                <div>
                    <p className="font-bold text-sm text-foreground">Nạp Credit ({item.code})</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-black text-sm ${isSuccess ? 'text-primary' : 'text-muted-foreground'}`}>
                    +{item.credits} Credits
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                    -{formatCurrency(item.amount)}
                </p>
            </div>
        </div>
    )
}