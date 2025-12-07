// app/(admin)/admin/page.tsx

'use client';

export const dynamic = 'force-dynamic';

import { getShopSettings, updateShopSettings } from '@/actions/admin.actions';
import DashboardStats from '@/components/admin/DashboardStats'; // Import component thống kê
import { Clock, CreditCard, Loader2, Megaphone, Save, Store, Users } from 'lucide-react';
import { useActionState, useEffect, useState } from 'react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [state, formAction, isPending] = useActionState(updateShopSettings, null);
  
  const loadSettings = async () => {
    setLoading(true);
    const data = await getShopSettings();
    setSettings(data);
    setLoading(false);
  };
  
  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (state?.success) {
      loadSettings(); 
      // Có thể thêm toast notification ở đây nếu muốn
    }
  }, [state]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto text-foreground space-y-10">
      
      {/* --- PHẦN 1: DASHBOARD THỐNG KÊ --- */}
      <section>
        <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
          <Store className="w-6 h-6 text-primary" />
          Dashboard Tổng Quan
        </h2>
        <DashboardStats />
      </section>

      <hr className="border-border" />

      {/* --- PHẦN 2: FORM CÀI ĐẶT --- */}
      <section>
        <h2 className="text-2xl font-black text-foreground mb-6">Cài đặt Cửa hàng</h2>

        {/* HIỂN THỊ THÔNG BÁO TỪ SERVER ACTION */}
        {state?.success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <span>✅ Đã lưu cài đặt thành công!</span>
            </div>
        )}

        {state?.error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <span>❌ Lỗi: {state.error}</span>
            </div>
        )}

        <form action={formAction} className="bg-card p-6 rounded-2xl shadow-sm border border-border space-y-8 text-card-foreground">
            
            {/* 1. Giờ mở cửa */}
            <div>
                <h3 className="flex items-center gap-2 font-bold text-lg text-foreground mb-4">
                    <Clock className="w-5 h-5 text-blue-500" /> Giờ hoạt động
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['morningOpen', 'morningClose', 'afternoonOpen', 'afternoonClose'].map((field) => (
                    <div key={field}>
                        <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase">
                            {field.replace('morning', 'Sáng ').replace('afternoon', 'Chiều ').replace('Open', 'Mở').replace('Close', 'Đóng')}
                        </label>
                        <input 
                            key={settings?.[field]} 
                            type="time" 
                            name={field} 
                            defaultValue={settings?.[field]} 
                            className="w-full p-2.5 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground" 
                        />
                    </div>
                    ))}
                </div>
            </div>

            <hr className="border-border border-dashed" />

            {/* 2. Giới hạn khách */}
            <div>
                <h3 className="flex items-center gap-2 font-bold text-lg text-foreground mb-4">
                    <Users className="w-5 h-5 text-purple-500" /> Giới hạn khách
                </h3>
                <div>
                    <label className="block text-sm text-muted-foreground mb-1">Số khách tối đa / ngày</label>
                    <input 
                        key={settings?.maxDailyTickets} 
                        type="number" 
                        name="maxDailyTickets" 
                        defaultValue={settings?.maxDailyTickets} 
                        className="w-full p-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground" 
                    />
                </div>
            </div>

            <hr className="border-border border-dashed" />

            {/* 3. Ngân hàng & QR */}
            <div>
                <h3 className="flex items-center gap-2 font-bold text-lg text-foreground mb-4">
                    <CreditCard className="w-5 h-5 text-green-500" /> Tài khoản nhận tiền
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Ngân hàng (VD: MB, VCB)</label>
                        <input 
                            key={settings?.bankName}
                            type="text" 
                            name="bankName" 
                            defaultValue={settings?.bankName} 
                            placeholder="MB"
                            className="w-full p-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">Số tài khoản</label>
                        <input 
                            key={settings?.bankAccountNo}
                            type="text" 
                            name="bankAccountNo" 
                            defaultValue={settings?.bankAccountNo} 
                            placeholder="0123456789"
                            className="w-full p-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground" 
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm text-muted-foreground mb-1">Tên chủ tài khoản (Viết hoa không dấu)</label>
                        <input 
                            key={settings?.bankAccountName}
                            type="text" 
                            name="bankAccountName" 
                            defaultValue={settings?.bankAccountName} 
                            placeholder="NGUYEN VAN A"
                            className="w-full p-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground" 
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm text-muted-foreground mb-1">Mẫu QR (VietQR Template)</label>
                        <select 
                            key={settings?.qrTemplate}
                            name="qrTemplate"
                            defaultValue={settings?.qrTemplate || 'compact2'}
                            className="w-full p-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground"
                        >
                            <option value="compact">Compact (Gọn)</option>
                            <option value="compact2">Compact 2 (Gọn + Header)</option>
                            <option value="qr_only">QR Only (Chỉ mã QR)</option>
                            <option value="print">Print (Mẫu in ấn)</option>
                        </select>
                    </div>
                </div>
            </div>

            <hr className="border-border border-dashed" />

            {/* 4. Trạng thái quán & Thông báo */}
            <div>
                <h3 className="flex items-center gap-2 font-bold text-lg text-foreground mb-4">
                    <Megaphone className="w-5 h-5 text-orange-500" /> Trạng thái & Thông báo
                </h3>
                <div className="space-y-4">
                    {/* Bật tắt quán */}
                    <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-border">
                        <div>
                            <span className="block font-bold text-foreground">Trạng thái Cửa hàng</span>
                            <span className="text-xs text-muted-foreground">Tắt nút này để tạm ngưng nhận khách mới</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input key={settings?.isShopOpen} type="checkbox" name="isShopOpen" defaultChecked={settings?.isShopOpen} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>

                    {/* Bật tắt thông báo */}
                    <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-border">
                        <div>
                            <span className="block font-bold text-foreground">Hiển thị thông báo</span>
                            <span className="text-xs text-muted-foreground">Hiện dòng chữ chạy trên trang chủ</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                key={settings?.isAnnouncementShow} 
                                type="checkbox" 
                                name="isAnnouncementShow" 
                                defaultChecked={settings?.isAnnouncementShow} 
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    {/* Nội dung thông báo */}
                    <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-2">Nội dung thông báo</label>
                        <textarea 
                            key={settings?.announcementText}
                            name="announcementText"
                            defaultValue={settings?.announcementText}
                            placeholder="Ví dụ: Quán nghỉ tết từ ngày 30/12 đến mùng 5 tết..."
                            rows={3}
                            className="w-full p-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Nút Submit Sticky hoặc Static */}
            <div className="pt-4 sticky bottom-4 z-10">
                <button 
                type="submit" 
                disabled={isPending}
                className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-xl
                    ${isPending 
                        ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                        : 'bg-primary text-primary-foreground hover:opacity-90 hover:scale-[1.01]'
                    }
                `}
                >
                {isPending ? (
                    <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Đang lưu thay đổi...
                    </>
                ) : (
                    <>
                    <Save className="w-6 h-6" /> LƯU CÀI ĐẶT
                    </>
                )}
                </button>
            </div>
        </form>
      </section>
    </div>
  );
}