// app/(admin)/admin/page.tsx
'use client';

import { getShopSettings, updateShopSettings } from '@/actions/admin.actions';
import { Clock, CreditCard, Loader2, Save, Users } from 'lucide-react';
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
      const timer = setTimeout(() => {}, 3000);
      return () => clearTimeout(timer);
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
    <div className="max-w-2xl mx-auto text-foreground">
      <h2 className="text-2xl font-bold mb-6">Cài đặt cửa hàng</h2>
      
      {/* HIỂN THỊ THÔNG BÁO TỪ STATE */}
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

      {/* SỬA: bg-card, border-border */}
      <form action={formAction} className="bg-card p-6 rounded-2xl shadow-sm border border-border space-y-6 text-card-foreground">
        
        {/* Giờ mở cửa */}
        <div>
          {/* SỬA: text-foreground */}
          <h3 className="flex items-center gap-2 font-semibold text-foreground mb-4">
            <Clock className="w-5 h-5" /> Giờ hoạt động
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* SỬA: input dùng bg-background border-input text-foreground */}
            {['morningOpen', 'morningClose', 'afternoonOpen', 'afternoonClose'].map((field) => (
              <div key={field}>
                 <label className="block text-sm text-muted-foreground mb-1 capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                 </label>
                 <input 
                    key={settings?.[field]} 
                    type="time" 
                    name={field} 
                    defaultValue={settings?.[field]} 
                    className="w-full p-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground" 
                 />
              </div>
            ))}
          </div>
        </div>

        <hr className="border-border" />

        {/* Giới hạn khách */}
        <div>
           <h3 className="flex items-center gap-2 font-semibold text-foreground mb-4">
            <Users className="w-5 h-5" /> Giới hạn khách
          </h3>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Số khách tối đa / ngày</label>
            <input 
                key={settings?.maxDailyTickets} 
                type="number" 
                name="maxDailyTickets" 
                defaultValue={settings?.maxDailyTickets} 
                className="w-full p-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground" 
            />
          </div>
        </div>

        <hr className="border-border" />
          <div>
           <h3 className="flex items-center gap-2 font-semibold text-foreground mb-4">
            <CreditCard className="w-5 h-5" /> Tài khoản nhận tiền (QR Code)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Ngân hàng */}
            <div>
                <label className="block text-sm text-muted-foreground mb-1">Ngân hàng (VD: MB, VCB)</label>
                <input 
                    key={settings?.bankName}
                    type="text" 
                    name="bankName" 
                    defaultValue={settings?.bankName} 
                    placeholder="MB"
                    className="w-full p-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground" 
                />
            </div>

            {/* Số tài khoản */}
            <div>
                <label className="block text-sm text-muted-foreground mb-1">Số tài khoản</label>
                <input 
                    key={settings?.bankAccountNo}
                    type="text" 
                    name="bankAccountNo" 
                    defaultValue={settings?.bankAccountNo} 
                    placeholder="0123456789"
                    className="w-full p-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground" 
                />
            </div>

            {/* Tên chủ TK */}
            <div className="md:col-span-2">
                <label className="block text-sm text-muted-foreground mb-1">Tên chủ tài khoản (Viết hoa không dấu)</label>
                <input 
                    key={settings?.bankAccountName}
                    type="text" 
                    name="bankAccountName" 
                    defaultValue={settings?.bankAccountName} 
                    placeholder="NGUYEN VAN A"
                    className="w-full p-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground" 
                />
            </div>

            {/* Mẫu QR (VietQR Template) */}
            <div className="md:col-span-2">
                <label className="block text-sm text-muted-foreground mb-1">Mẫu QR (VietQR Template)</label>
                <select 
                    key={settings?.qrTemplate}
                    name="qrTemplate"
                    defaultValue={settings?.qrTemplate || 'compact2'}
                    className="w-full p-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary outline-none text-foreground"
                >
                    <option value="compact">Compact (Gọn)</option>
                    <option value="compact2">Compact 2 (Gọn + Header)</option>
                    <option value="qr_only">QR Only (Chỉ mã QR)</option>
                    <option value="print">Print (Mẫu in ấn)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">Chọn mẫu hiển thị khi tạo mã VietQR.</p>
            </div>
          </div>
        </div>

        <hr className="border-border" />
        {/* Trạng thái quán */}
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground">Trạng thái Cửa hàng</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input key={settings?.isShopOpen} type="checkbox" name="isShopOpen" defaultChecked={settings?.isShopOpen} className="sr-only peer" />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            <span className="ml-3 text-sm font-medium text-foreground">Đang mở cửa</span>
          </label>
        </div>

        {/* Nút Submit */}
        <button 
          type="submit" 
          disabled={isPending}
          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
            ${isPending 
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl'
            }
          `}
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" /> Lưu cài đặt
            </>
          )}
        </button>
      </form>
    </div>
  );
}