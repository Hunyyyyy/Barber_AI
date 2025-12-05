'use client';

import { updateUserInfo, uploadUserAvatar } from '@/actions/user.actions';
import CreditTopUpModal from '@/components/profile/CreditTopUpModal'; // Component modal nạp tiền bên dưới
import { FaceShape } from '@prisma/client'; // Import Enum từ Prisma
import { Camera, CreditCard, Loader2, Pencil, Save, User } from 'lucide-react';
import { useState } from 'react';

interface ProfileContentProps {
  user: any; // Type chính xác là User từ Prisma
}

export default function ProfileContent({ user }: ProfileContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
const [isUploading, setIsUploading] = useState(false); // State loading cho upload ảnh
  // State form data
  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    phone: user.phone || '',
    faceShape: user.faceShape || 'OVAL', // Mặc định hoặc lấy từ DB
    avatarUrl: user.avatarUrl || '',
  });

  // Xử lý thay đổi input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Xử lý upload ảnh (Giả lập - Cần tích hợp Supabase Storage thực tế)
  // --- XỬ LÝ UPLOAD ẢNH MỚI ---
// --- XỬ LÝ UPLOAD ẢNH MỚI ---
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Preview ảnh ngay lập tức (UX)
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, avatarUrl: previewUrl }));

    // 2. Gọi Server Action Upload
    setIsUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    const res = await uploadUserAvatar(formDataUpload);
    
    setIsUploading(false);

    if (res.success) {
      // [FIX]: Thêm kiểm tra 'user' in res để TypeScript hiểu đây là object thành công
      if ('user' in res && res.user?.avatarUrl) {
          // Lưu ý: res.user.avatarUrl có thể null nên cần check kỹ hoặc ép kiểu string nếu chắc chắn
          const newUrl = res.user.avatarUrl;
          setFormData((prev) => ({ ...prev, avatarUrl: newUrl || '' }));
      }
      alert("Đổi ảnh đại diện thành công!");
    } else {
      // Với trường hợp lỗi, res có thể không có error message rõ ràng tuỳ vào type
      // Dùng cú pháp an toàn: ('error' in res ? res.error : "Lỗi upload ảnh")
      alert('error' in res ? res.error : "Lỗi upload ảnh");
      
      // Revert về ảnh cũ nếu lỗi (tuỳ chọn)
      // setFormData((prev) => ({ ...prev, avatarUrl: user.avatarUrl || '' }));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    // Chỉ gửi thông tin text, avatar đã xử lý riêng ở trên
    const res = await updateUserInfo({
      fullName: formData.fullName,
      phone: formData.phone,
      faceShape: formData.faceShape as FaceShape,
    });

    if (res.success) {
      setIsEditing(false);
      alert('Cập nhật thành công!');
    } else {
      alert(res.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* --- PHẦN 1: THẺ THÔNG TIN & EDIT --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-gray-900 to-gray-700"></div>
        
        <div className="relative flex flex-col items-center mt-8">
          {/* Avatar Upload */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-200">
               {formData.avatarUrl ? (
                 <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User className="w-12 h-12"/>
                 </div>
               )}
            </div>
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            )}
          </div>

          {/* Tên & Credits */}
          {!isEditing ? (
            <div className="text-center mt-4">
              <h2 className="text-2xl font-bold text-gray-900">{user.fullName || 'Chưa đặt tên'}</h2>
              <p className="text-gray-500 text-sm mb-4">{user.phone || 'Chưa có SĐT'}</p>
              
              <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-full border border-yellow-200 font-bold">
                <CreditCard className="w-4 h-4" />
                <span>{user.credits} Credits</span>
              </div>
            </div>
          ) : (
             <div className="text-center mt-4 text-sm text-gray-500">Đang chỉnh sửa hồ sơ...</div>
          )}
        </div>

        {/* Nút Edit / Save (Góc trên phải) */}
        <div className="absolute top-4 right-4 z-10">
            {isEditing ? (
                 <div className="flex gap-2">
                    <button 
                        onClick={() => setIsEditing(false)} 
                        className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl font-medium hover:bg-white/30 transition text-sm"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2 text-sm shadow-lg"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                        Lưu
                    </button>
                 </div>
            ) : (
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="bg-white/20 backdrop-blur-md text-white p-2 rounded-xl hover:bg-white/30 transition"
                >
                    <Pencil className="w-5 h-5"/>
                </button>
            )}
        </div>
      </div>

      {/* --- PHẦN 2: FORM CHỈNH SỬA (Hiện khi isEditing = true) --- */}
      {isEditing && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 animate-in slide-in-from-top-4 duration-300">
            <h3 className="font-bold text-lg mb-4">Thông tin chi tiết</h3>
            <div className="grid gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                    <input 
                        type="text" 
                        name="fullName"
                        value={formData.fullName} 
                        onChange={handleChange}
                        className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="Nhập họ tên..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                    <input 
                        type="text" 
                        name="phone"
                        value={formData.phone} 
                        onChange={handleChange}
                        className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="09..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dáng khuôn mặt</label>
                    <select 
                        name="faceShape"
                        value={formData.faceShape}
                        onChange={handleChange}
                        className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
                    >
                        {Object.keys(FaceShape).map((shape) => (
                            <option key={shape} value={shape}>{shape}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
      )}

      {/* --- PHẦN 3: NẠP CREDITS --- */}
      <div className="bg-gradient-to-br from-black to-neutral-800 rounded-3xl shadow-lg p-6 text-white relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
            <div>
                <h3 className="text-xl font-bold">Nạp thêm Credit</h3>
                <p className="text-gray-400 text-sm mt-1">Sử dụng AI tạo kiểu tóc không giới hạn</p>
            </div>
            <button 
                onClick={() => setShowTopUpModal(true)}
                className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition shadow-lg active:scale-95 transform"
            >
                Nạp Ngay
            </button>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
      </div>

      {/* MODAL NẠP TIỀN */}
      {showTopUpModal && (
        <CreditTopUpModal 
            user={user} 
            onClose={() => setShowTopUpModal(false)} 
        />
      )}
    </div>
  );
}