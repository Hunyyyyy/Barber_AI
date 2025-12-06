'use client';

import { getShopSettings, updateShopSettings } from '@/actions/admin.actions';
import { Clock, Loader2, Save, Users } from 'lucide-react';
import { useActionState, useEffect, useState } from 'react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // useActionState trả về [state, action, isPending]
  // state: kết quả trả về từ server action (success/error)
  // isPending: trạng thái đang gửi dữ liệu
  const [state, formAction, isPending] = useActionState(updateShopSettings, null);
  const loadSettings = async () => {
    setLoading(true);
    const data = await getShopSettings();
    setSettings(data);
    setLoading(false);
  };
  // Lấy dữ liệu ban đầu
  useEffect(() => {
    loadSettings();
  }, []);
  // Tự động ẩn thông báo success sau 3 giây (Option)
  useEffect(() => {
    if (state?.success) {
      loadSettings(); // <-- GỌI LẠI HÀM NÀY ĐỂ CẬP NHẬT `settings` STATE!
      
      // Tùy chọn: Sau 3 giây, bạn có thể tắt trạng thái loading thành công nếu muốn
      const timer = setTimeout(() => {
        // [Tùy chọn] Có thể dùng một state khác để quản lý thông báo, ví dụ: setSuccessMessage(null)
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Cài đặt cửa hàng</h2>
      
      {/* HIỂN THỊ THÔNG BÁO TỪ STATE */}
      {state?.success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>✅ Đã lưu cài đặt thành công!</span>
        </div>
      )}

      {state?.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>❌ Lỗi: {state.error}</span>
        </div>
      )}

      <form action={formAction} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        
        {/* Giờ mở cửa */}
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-gray-800 mb-4">
            <Clock className="w-5 h-5" /> Giờ hoạt động
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Sáng - Mở</label>
              <input key={settings?.morningOpen} type="time" name="morningOpen" defaultValue={settings?.morningOpen} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Sáng - Đóng</label>
              <input key={settings?.morningOpen} type="time" name="morningClose" defaultValue={settings?.morningClose} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Chiều - Mở</label>
              <input key={settings?.morningOpen} type="time" name="afternoonOpen" defaultValue={settings?.afternoonOpen} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Chiều - Đóng</label>
              <input key={settings?.morningOpen} type="time" name="afternoonClose" defaultValue={settings?.afternoonClose} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" />
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Giới hạn khách */}
        <div>
           <h3 className="flex items-center gap-2 font-semibold text-gray-800 mb-4">
            <Users className="w-5 h-5" /> Giới hạn khách
          </h3>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Số khách tối đa / ngày</label>
            <input key={settings?.morningOpen} type="number" name="maxDailyTickets" defaultValue={settings?.maxDailyTickets} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-black outline-none" />
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Trạng thái quán */}
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-800">Trạng thái Cửa hàng</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input key={settings?.morningOpen} type="checkbox" name="isShopOpen" defaultChecked={settings?.isShopOpen} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-900">Đang mở cửa</span>
          </label>
        </div>

        {/* Nút Submit có trạng thái Loading */}
        <button 
          type="submit" 
          disabled={isPending}
          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
            ${isPending ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl'}
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