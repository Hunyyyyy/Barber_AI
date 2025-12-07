// components/admin/DashboardStats.tsx
"use client";

import { getDashboardStats } from "@/actions/admin.actions";
import { formatCurrency } from "@/lib/utils";
import { Calendar, Crown, DollarSign, Loader2, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-card border border-border rounded-2xl animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground font-medium">Đang tính toán số liệu...</span>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. SECTION DOANH THU TỔNG QUAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Doanh thu ngày */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg shadow-blue-500/20 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 opacity-90">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase tracking-wide">Hôm nay</span>
                </div>
                <div className="text-3xl font-black mb-1">{formatCurrency(stats.daily.revenue)}</div>
                <div className="text-sm opacity-80 font-medium">
                    {stats.daily.customers} khách hàng
                </div>
            </div>
            <DollarSign className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-10 rotate-12" />
        </div>

        {/* Doanh thu tháng */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg shadow-purple-500/20 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 opacity-90">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-bold uppercase tracking-wide">Tháng này</span>
                </div>
                <div className="text-3xl font-black mb-1">{formatCurrency(stats.monthly.revenue)}</div>
                <div className="text-sm opacity-80 font-medium">
                    {stats.monthly.customers} lượt khách
                </div>
            </div>
            <Crown className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-10 rotate-12" />
        </div>
      </div>

      {/* 2. TOP KHÁCH HÀNG (VIP) */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                Top Khách Hàng Năm Nay
            </h3>
            <span className="text-xs font-medium px-2 py-1 bg-background border border-border rounded-md text-muted-foreground">
                Đã thanh toán
            </span>
        </div>
        
        <div className="divide-y divide-border">
            {stats.topCustomers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Chưa có dữ liệu thống kê.</div>
            ) : (
                stats.topCustomers.map((customer: any, idx: number) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                            {/* Avatar / Rank Badge */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                                idx === 0 ? 'bg-yellow-100 text-yellow-700 border-yellow-500' :
                                idx === 1 ? 'bg-gray-100 text-gray-700 border-gray-400' :
                                idx === 2 ? 'bg-orange-100 text-orange-700 border-orange-400' :
                                'bg-muted text-muted-foreground border-transparent'
                            }`}>
                                {idx + 1}
                            </div>
                            <div>
                                <p className="font-bold text-foreground">{customer.fullName || 'Khách vãng lai'}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Users className="w-3 h-3" /> {customer.phone}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-primary">{formatCurrency(customer.totalSpent)}</p>
                            <p className="text-xs text-muted-foreground">{customer.visitCount} lần cắt</p>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
}