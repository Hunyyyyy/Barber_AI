// components/profile/ProfileContent.tsx
'use client';

import { updateUserInfo, uploadUserAvatar } from '@/actions/user.actions';
import CreditTopUpModal from '@/components/profile/CreditTopUpModal';
import { FaceShape } from '@prisma/client';
import { Camera, CreditCard, Loader2, Pencil, Save, User } from 'lucide-react';
import { useState } from 'react';

interface ProfileContentProps {
  user: any;
}

export default function ProfileContent({ user }: ProfileContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    fullName: user.fullName || '',
    phone: user.phone || '',
    faceShape: user.faceShape || 'OVAL',
    avatarUrl: user.avatarUrl || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, avatarUrl: previewUrl }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    let newAvatarUrl = formData.avatarUrl;

    try {
      if (selectedFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', selectedFile);
        const uploadRes = await uploadUserAvatar(formDataUpload);
        if (!uploadRes.success || !('user' in uploadRes)) {
           alert(uploadRes.error || "Lỗi upload ảnh");
           setIsLoading(false);
           return; 
        }
        newAvatarUrl = uploadRes.user?.avatarUrl || newAvatarUrl;
      }

      const hasDataChanged = 
          formData.fullName !== user.fullName ||
          formData.phone !== user.phone ||
          formData.faceShape !== user.faceShape;

      if (selectedFile || hasDataChanged) {
          const updateRes = await updateUserInfo({
            fullName: formData.fullName,
            phone: formData.phone,
            faceShape: formData.faceShape as FaceShape,
            avatarUrl: newAvatarUrl,
          });

          if (updateRes.success) {
            alert('Cập nhật hồ sơ thành công!');
            setIsEditing(false);
            setSelectedFile(null);
          } else {
            alert(updateRes.error);
          }
      } else {
          setIsEditing(false);
      }

    } catch (error) {
      console.error(error);
      alert("Đã có lỗi xảy ra.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        faceShape: user.faceShape || 'OVAL',
        avatarUrl: user.avatarUrl || '',
      });
      setSelectedFile(null);
      setIsEditing(false);
  }

  return (
    <div className="space-y-6">
      {/* --- PHẦN 1: THẺ THÔNG TIN & EDIT --- */}
      {/* SỬA: bg-card, border-border, text-card-foreground */}
      <div className="bg-card rounded-3xl shadow-sm border border-border p-6 relative overflow-hidden text-card-foreground">
        {/* Banner Gradient */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-neutral-800 dark:to-neutral-900"></div>
        
        <div className="relative flex flex-col items-center mt-8">
          {/* Avatar Upload */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-card shadow-md overflow-hidden bg-muted flex items-center justify-center">
               {formData.avatarUrl ? (
                 <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 // SỬA: text-muted-foreground
                 <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <User className="w-12 h-12"/>
                 </div>
               )}
            </div>
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:opacity-90 transition shadow-lg">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            )}
          </div>

          {/* Tên & Credits */}
          {!isEditing ? (
            <div className="text-center mt-4">
              <h2 className="text-2xl font-bold text-foreground">{user.fullName || 'Chưa đặt tên'}</h2>
              <p className="text-muted-foreground text-sm mb-4">{user.phone || 'Chưa có SĐT'}</p>
              
              <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-4 py-2 rounded-full border border-yellow-200 dark:border-yellow-800 font-bold">
                <CreditCard className="w-4 h-4" />
                <span>{user.credits} Credits</span>
              </div>
            </div>
          ) : (
             <div className="text-center mt-4 text-sm text-muted-foreground">Đang chỉnh sửa hồ sơ...</div>
          )}
        </div>

        {/* Nút Edit / Save (Góc trên phải) */}
        <div className="absolute top-4 right-4 z-10">
            {isEditing ? (
                 <div className="flex gap-2">
                    <button 
                        onClick={handleCancel} 
                        className="bg-black/20 backdrop-blur-md text-white px-4 py-2 rounded-xl font-medium hover:bg-black/30 transition text-sm"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isLoading}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-bold hover:opacity-90 transition flex items-center gap-2 text-sm shadow-lg"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                        Lưu
                    </button>
                 </div>
            ) : (
                <button 
                    onClick={() => setIsEditing(true)} 
                    className="bg-black/20 backdrop-blur-md text-white p-2 rounded-xl hover:bg-black/30 transition"
                >
                    <Pencil className="w-5 h-5"/>
                </button>
            )}
        </div>
      </div>

      {/* --- PHẦN 2: FORM CHỈNH SỬA --- */}
      {isEditing && (
        <div className="bg-card rounded-3xl shadow-sm border border-border p-6 animate-in slide-in-from-top-4 duration-300 text-card-foreground">
            <h3 className="font-bold text-lg mb-4 text-foreground">Thông tin chi tiết</h3>
            <div className="grid gap-4">
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Họ và tên</label>
                    <input 
                        type="text" 
                        name="fullName"
                        value={formData.fullName} 
                        onChange={handleChange}
                        className="w-full p-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-foreground placeholder:text-muted-foreground"
                        placeholder="Nhập họ tên..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Số điện thoại</label>
                    <input 
                        type="text" 
                        name="phone"
                        value={formData.phone} 
                        onChange={handleChange}
                        className="w-full p-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-foreground placeholder:text-muted-foreground"
                        placeholder="09..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Dáng khuôn mặt</label>
                    <select 
                        name="faceShape"
                        value={formData.faceShape}
                        onChange={handleChange}
                        className="w-full p-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary outline-none transition text-foreground appearance-none cursor-pointer"
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
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 dark:from-neutral-800 dark:to-neutral-950 rounded-3xl shadow-lg p-6 text-white relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
            <div>
                <h3 className="text-xl font-bold">Nạp thêm Credit</h3>
                <p className="text-neutral-400 text-sm mt-1">Sử dụng AI tạo kiểu tóc không giới hạn</p>
            </div>
            <button 
                onClick={() => setShowTopUpModal(true)}
                className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-neutral-200 transition shadow-lg active:scale-95 transform"
            >
                Nạp Ngay
            </button>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl"></div>
      </div>

      {showTopUpModal && (
        <CreditTopUpModal 
            user={user} 
            onClose={() => setShowTopUpModal(false)} 
        />
      )}
    </div>
  );
}