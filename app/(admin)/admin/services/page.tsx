'use client';

import { deleteService, getAdminServices, upsertService } from '@/actions/admin.actions';
import { formatCurrency } from '@/lib/utils';
import { Banknote, Clock, Edit2, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { useActionState, useEffect, useState } from 'react';

// Định nghĩa kiểu dữ liệu form để quản lý state edit
interface ServiceFormState {
  id: string;
  name: string;
  price: string | number;
  durationWork: string | number;
  durationWait: string | number;
  isActive: boolean;
}

const INITIAL_FORM: ServiceFormState = {
  id: '',
  name: '',
  price: '',
  durationWork: '',
  durationWait: 0,
  isActive: true,
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  
  // State quản lý Form (Controlled Input) thay vì dùng document.querySelector
  const [formData, setFormData] = useState<ServiceFormState>(INITIAL_FORM);
  const isEditing = !!formData.id;

  // useActionState
  const [state, formAction, isPending] = useActionState(upsertService, null);

  // Hàm load dữ liệu
  const loadServices = async () => {
    const data = await getAdminServices();
    setServices(data);
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Effect xử lý kết quả trả về từ Server Action
  useEffect(() => {
    if (state?.success) {
      loadServices(); // Refresh list
      handleCancel(); // Reset form
      // Có thể thêm toast notification ở đây
    }
  }, [state]);

  // Xử lý khi bấm nút Sửa
  const handleEdit = (svc: any) => {
    setFormData({
      id: svc.id,
      name: svc.name,
      price: svc.price,
      durationWork: svc.durationWork,
      durationWait: svc.durationWait,
      isActive: svc.isActive,
    });
    // Scroll to form (mobile friendly)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Xử lý khi bấm Hủy
  const handleCancel = () => {
    setFormData(INITIAL_FORM);
  };

  // Xử lý xóa
  const handleDelete = async (id: string) => {
    if(!confirm('Bạn chắc chắn muốn xóa dịch vụ này? Hành động này không thể hoàn tác.')) return;
    const res = await deleteService(id);
    if(res.success) {
        loadServices();
    } else {
        alert(res.error);
    }
  };

  // Helper update form state
  const handleChange = (field: keyof ServiceFormState, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* CỘT TRÁI: FORM THÊM/SỬA */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                {isEditing ? <Edit2 className="w-5 h-5 text-blue-600"/> : <Plus className="w-5 h-5 text-green-600"/>}
                {isEditing ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}
            </h3>

            {/* Hiển thị lỗi/thành công */}
            {state?.error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
                    ❌ {state.error}
                </div>
            )}
            {state?.success && state?.message && (
                <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-200">
                    ✅ {state.message}
                </div>
            )}

            <form action={formAction} className="space-y-4">
                <input type="hidden" name="id" value={formData.id} />
                
                {/* Tên dịch vụ */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Tên dịch vụ</label>
                    <input 
                        name="name" 
                        value={formData.name}
                        onChange={e => handleChange('name', e.target.value)}
                        placeholder="Ví dụ: Cắt tóc nam" 
                        className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-black outline-none" 
                        required 
                    />
                </div>
                
                {/* Giá tiền */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Giá tiền (VNĐ)</label>
                    <div className="relative">
                        <Banknote className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                        <input 
                            name="price" 
                            type="number" 
                            value={formData.price}
                            onChange={e => handleChange('price', e.target.value)}
                            placeholder="50000" 
                            className="w-full pl-9 p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-black outline-none" 
                            required 
                        />
                    </div>
                </div>

                {/* Thời gian */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">TG Làm (Phút)</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                            <input 
                                name="durationWork" 
                                type="number" 
                                value={formData.durationWork}
                                onChange={e => handleChange('durationWork', e.target.value)}
                                placeholder="30" 
                                className="w-full pl-9 p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-black outline-none" 
                                required 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">TG Chờ (Phút)</label>
                        <input 
                            name="durationWait" 
                            type="number" 
                            value={formData.durationWait}
                            onChange={e => handleChange('durationWait', e.target.value)}
                            className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-black outline-none" 
                        />
                    </div>
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-2 mt-2">
                    <input 
                        type="checkbox" 
                        name="isActive" 
                        id="isActive"
                        checked={formData.isActive}
                        onChange={e => handleChange('isActive', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black" 
                    />
                    <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">Đang hoạt động (Hiện trên menu)</label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <button 
                        type="submit" 
                        disabled={isPending}
                        className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                            ${isPending ? 'bg-gray-100 text-gray-400' : 'bg-black text-white hover:bg-gray-800 shadow-lg'}
                        `}
                    >
                        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isEditing ? 'Cập nhật' : 'Lưu dịch vụ'}
                    </button>
                    
                    {isEditing && (
                         <button 
                            type="button" 
                            onClick={handleCancel} 
                            disabled={isPending}
                            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </form>
        </div>
      </div>

      {/* CỘT PHẢI: DANH SÁCH */}
      <div className="lg:col-span-2 space-y-4">
        {services.length === 0 && (
            <div className="text-center py-10 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                Chưa có dịch vụ nào. Hãy thêm mới bên trái.
            </div>
        )}

        {services.map(svc => (
            <div key={svc.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all hover:shadow-md">
                <div className="flex-1">
                    <h4 className="font-bold text-lg flex items-center gap-2 text-gray-900">
                        {svc.name}
                        {!svc.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Đã ẩn</span>}
                    </h4>
                    <div className="flex items-center gap-4 text-gray-500 text-sm mt-1">
                        <span className="flex items-center gap-1 font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">
                            <Banknote className="w-3 h-3" /> {formatCurrency(svc.price)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 
                            {svc.durationWork}p làm 
                            {svc.durationWait > 0 && <span className="text-orange-500"> + {svc.durationWait}p chờ</span>}
                        </span>
                    </div>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                        onClick={() => handleEdit(svc)} 
                        className="flex-1 sm:flex-none p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-black hover:text-white transition-all border border-gray-200"
                        title="Sửa"
                    >
                        <Edit2 className="w-4 h-4 mx-auto" />
                    </button>
                    <button 
                        onClick={() => handleDelete(svc.id)} 
                        className="flex-1 sm:flex-none p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100"
                        title="Xóa"
                    >
                        <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}