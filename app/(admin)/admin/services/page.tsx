'use client';

import { deleteService, getAdminServices, upsertService } from '@/actions/admin.actions';
import { formatCurrency } from '@/lib/utils';
import { Banknote, Clock, Edit2, Loader2, Plus, Save, Tag, Trash2, X } from 'lucide-react';
import { useActionState, useEffect, useState } from 'react';

interface ServiceFormState {
  id: string;
  name: string;
  price: string | number;
  discountPrice: string | number; // [MỚI] Thêm trường giảm giá
  durationWork: string | number;
  durationWait: string | number;
  isActive: boolean;
}

const INITIAL_FORM: ServiceFormState = {
  id: '',
  name: '',
  price: '',
  discountPrice: '', // [MỚI]
  durationWork: '',
  durationWait: 0,
  isActive: true,
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [formData, setFormData] = useState<ServiceFormState>(INITIAL_FORM);
  const isEditing = !!formData.id;
  const [state, formAction, isPending] = useActionState(upsertService, null);

  const loadServices = async () => {
    const data = await getAdminServices();
    setServices(data);
  };

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (state?.success) {
      loadServices(); 
      handleCancel(); 
    }
  }, [state]);

  const handleEdit = (svc: any) => {
    setFormData({
      id: svc.id,
      name: svc.name,
      price: svc.price,
      discountPrice: svc.discountPrice || '', // [MỚI] Load giá giảm lên form
      durationWork: svc.durationWork,
      durationWait: svc.durationWait,
      isActive: svc.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setFormData(INITIAL_FORM);
  };

  const handleDelete = async (id: string) => {
    if(!confirm('Bạn chắc chắn muốn xóa dịch vụ này? Hành động này không thể hoàn tác.')) return;
    const res = await deleteService(id);
    if(res.success) {
        loadServices();
    } else {
        alert(res.error);
    }
  };

  const handleChange = (field: keyof ServiceFormState, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* CỘT TRÁI: FORM THÊM/SỬA */}
      <div className="lg:col-span-1">
        <div className="bg-card text-card-foreground p-6 rounded-2xl shadow-sm border border-border sticky top-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                {isEditing ? <Edit2 className="w-5 h-5 text-blue-500"/> : <Plus className="w-5 h-5 text-green-500"/>}
                {isEditing ? 'Sửa dịch vụ' : 'Thêm dịch vụ mới'}
            </h3>

            {state?.error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">
                    ❌ {state.error}
                </div>
            )}
            {state?.success && state?.message && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg border border-green-200 dark:border-green-800">
                    ✅ {state.message}
                </div>
            )}

            <form action={formAction} className="space-y-4">
                <input type="hidden" name="id" value={formData.id} />
                
                {/* Tên dịch vụ */}
                <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase">Tên dịch vụ</label>
                    <input 
                        name="name" 
                        value={formData.name}
                        onChange={e => handleChange('name', e.target.value)}
                        placeholder="Ví dụ: Cắt tóc nam" 
                        className="w-full p-3 bg-background border border-input text-foreground rounded-xl mt-1 focus:ring-2 focus:ring-primary outline-none placeholder:text-muted-foreground" 
                        required 
                    />
                </div>
                
                {/* [MỚI] Grid 2 cột cho Giá tiền */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase">Giá Gốc</label>
                        <div className="relative">
                            <Banknote className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                            <input 
                                name="price" 
                                type="number" 
                                value={formData.price}
                                onChange={e => handleChange('price', e.target.value)}
                                placeholder="50000" 
                                className="w-full pl-9 p-3 bg-background border border-input text-foreground rounded-xl mt-1 focus:ring-2 focus:ring-primary outline-none placeholder:text-muted-foreground" 
                                required 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-red-500 uppercase">Giá KM (Nếu có)</label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-3.5 w-4 h-4 text-red-500" />
                            <input 
                                name="discountPrice" 
                                type="number" 
                                value={formData.discountPrice}
                                onChange={e => handleChange('discountPrice', e.target.value)}
                                placeholder="45000" 
                                className="w-full pl-9 p-3 bg-background border border-red-200 text-foreground rounded-xl mt-1 focus:ring-2 focus:ring-red-500 outline-none placeholder:text-muted-foreground" 
                            />
                        </div>
                    </div>
                </div>

                {/* Thời gian */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase">TG Làm (Phút)</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
                            <input 
                                name="durationWork" 
                                type="number" 
                                value={formData.durationWork}
                                onChange={e => handleChange('durationWork', e.target.value)}
                                placeholder="30" 
                                className="w-full pl-9 p-3 bg-background border border-input text-foreground rounded-xl mt-1 focus:ring-2 focus:ring-primary outline-none placeholder:text-muted-foreground" 
                                required 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase">TG Chờ (Phút)</label>
                        <input 
                            name="durationWait" 
                            type="number" 
                            value={formData.durationWait}
                            onChange={e => handleChange('durationWait', e.target.value)}
                            className="w-full p-3 bg-background border border-input text-foreground rounded-xl mt-1 focus:ring-2 focus:ring-primary outline-none placeholder:text-muted-foreground" 
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
                        className="w-5 h-5 rounded border-input bg-background text-primary focus:ring-primary" 
                    />
                    <label htmlFor="isActive" className="text-sm font-medium cursor-pointer text-foreground">Đang hoạt động (Hiện trên menu)</label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <button 
                        type="submit" 
                        disabled={isPending}
                        className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                            ${isPending ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg'}
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
                            className="px-4 py-3 bg-muted hover:bg-accent rounded-xl font-bold text-muted-foreground hover:text-foreground transition-colors"
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
            <div className="text-center py-10 text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
                Chưa có dịch vụ nào. Hãy thêm mới bên trái.
            </div>
        )}

        {services.map(svc => {
             // [MỚI] Logic hiển thị giá
             const hasDiscount = svc.discountPrice && svc.discountPrice < svc.price;

             return (
                <div key={svc.id} className="bg-card text-card-foreground p-5 rounded-2xl shadow-sm border border-border flex flex-col sm:flex-row justify-between items-center gap-4 transition-all hover:shadow-md">
                    <div className="flex-1">
                        <h4 className="font-bold text-lg flex items-center gap-2 text-foreground">
                            {svc.name}
                            {!svc.isActive && <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">Đã ẩn</span>}
                            {/* [MỚI] Badge Sale */}
                            {hasDiscount && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">SALE</span>}
                        </h4>
                        <div className="flex items-center gap-4 text-muted-foreground text-sm mt-1">
                            {/* [MỚI] Hiển thị giá */}
                            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-lg">
                                <Banknote className="w-3 h-3" />
                                {hasDiscount ? (
                                    <>
                                        <span className="line-through text-gray-400 text-xs">{formatCurrency(svc.price)}</span>
                                        <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(svc.discountPrice)}</span>
                                    </>
                                ) : (
                                    <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(svc.price)}</span>
                                )}
                            </div>

                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> 
                                {svc.durationWork}p làm 
                                {svc.durationWait > 0 && <span className="text-orange-500 dark:text-orange-400"> + {svc.durationWait}p chờ</span>}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => handleEdit(svc)} 
                            className="flex-1 sm:flex-none p-2 bg-muted text-muted-foreground rounded-xl hover:bg-primary hover:text-primary-foreground transition-all border border-border"
                            title="Sửa"
                        >
                            <Edit2 className="w-4 h-4 mx-auto" />
                        </button>
                        <button 
                            onClick={() => handleDelete(svc.id)} 
                            className="flex-1 sm:flex-none p-2 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-all border border-red-100 dark:border-red-900/30"
                            title="Xóa"
                        >
                            <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}