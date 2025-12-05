// app/queue/select-service/page.tsx
'use client';

// Import thêm createQueueTicket
import { createQueueTicket, getServices } from '@/actions/queue.actions';
import ServiceSelector from '@/components/queue/ServiceSelector';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
//import toast from 'react-hot-toast';

export default function SelectServicePage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [services, setServices] = useState<any[]>([]);
  // const [shopSettings, setShopSettings] = useState<any>(null); // Không dùng đến biến này ở UI hiện tại
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // Lấy danh sách dịch vụ
  useEffect(() => {
    getServices().then(data => {
      setServices(data);
      setLoading(false);
    }).catch(() => {
      //toast.error('Không tải được dịch vụ');
      setLoading(false);
    });
  }, []);

  const toggleService = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // --- HÀM ĐÃ SỬA ĐỔI ---
  const handleConfirm = async () => {
    if (selected.length === 0) {
      console.error('Vui lòng chọn ít nhất 1 dịch vụ');
      // toast.error('Vui lòng chọn ít nhất 1 dịch vụ');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Tạo FormData (vì Action yêu cầu FormData)
      const formData = new FormData();
      formData.append('services', JSON.stringify(selected));
      // Tên và SĐT sẽ được Action tự lấy từ User Session trong DB

      // 2. Gọi Server Action trực tiếp
      // Tham số đầu tiên là null (thay cho prevState), tham số thứ 2 là formData
      const res = await createQueueTicket(null, formData);

      // 3. Kiểm tra kết quả
      if (!res.success) {
        throw new Error(res.error || 'Đặt số thất bại');
      }

      // 4. Thành công
      // toast.success(`Đặt số thành công!`);
      
      // Có thể truyền ID vé qua query param nếu trang success cần hiển thị chi tiết
      // router.push(`/queue/success?ticketId=${res.ticket.id}`);
      router.push('/queue/success');

    } catch (err: any) {
      console.error(err);
      // toast.error(err.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSubmitting(false);
    }
  };
  // ----------------------

  // Tính tổng tiền
  const totalPrice = selected.reduce((sum, id) => {
    const svc = services.find(s => s.id === id);
    return sum + (svc?.price || 0);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
              <div className="px-6 lg:px-12 py-6 flex items-center justify-between">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 px-4 py-3 rounded-xl transition-all group"
                >
                  <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                  <span className="font-semibold">Quay lại</span>
                </button>

                <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-black to-gray-700">
                  Chọn dịch vụ của bạn
                </h1>

                <div className="w-32"></div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 p-8 lg:p-12">
              {/* Danh sách dịch vụ */}
              <div className="lg:col-span-2">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Dịch vụ phổ biến</h2>
                  <p className="text-gray-600">Chọn một hoặc nhiều dịch vụ bạn muốn</p>
                </div>

                {services.length > 0 ? (
                  <ServiceSelector services={services} selected={selected} onToggle={toggleService} />
                ) : (
                  <p className="text-gray-500 text-center py-10">Chưa có dịch vụ nào được cấu hình</p>
                )}
              </div>

              {/* Tóm tắt đơn hàng */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-b from-black to-gray-900 text-white rounded-3xl p-8 sticky top-32 shadow-2xl">
                  <h3 className="text-xl font-bold mb-6">Tóm tắt đơn hàng</h3>

                  <div className="space-y-4 mb-8 min-h-[200px]">
                    {selected.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">Chưa chọn dịch vụ nào</p>
                    ) : (
                      selected.map(id => {
                        const svc = services.find(s => s.id === id);
                        const name = svc?.name || id;
                        return (
                          <div key={id} className="flex justify-between items-center">
                            <span className="text-gray-300">{name}</span>
                            <button
                              onClick={() => toggleService(id)}
                              className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-white/20 pt-6">
                    <div className="flex justify-between items-center mb-8">
                      <span className="text-lg">Tổng cộng</span>
                      <span className="text-3xl font-black">
                        {formatCurrency(totalPrice)}
                      </span>
                    </div>

                    <button
                      disabled={selected.length === 0 || submitting}
                      onClick={handleConfirm}
                      className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform ${
                        selected.length === 0 || submitting
                          ? 'bg-gray-700 cursor-not-allowed'
                          : 'bg-white text-black hover:bg-gray-100 hover:scale-105 shadow-2xl'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          <span>Đang xử lý...</span>
                        </>
                      ) : (
                        <>
                          <span>Xác nhận lấy số</span>
                          <ChevronRight className="w-6 h-6" />
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-400 text-center mt-4 opacity-80">
                      Bạn sẽ nhận số thứ tự ngay sau khi xác nhận
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}