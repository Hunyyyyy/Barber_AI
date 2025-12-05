'use client';

import { getAllUsers, searchUsers, updateUserRole } from '@/actions/admin.actions';
import { Role } from '@prisma/client';
import { Loader2, Search, Shield, UserCog } from 'lucide-react'; // Thêm icon Loader2
import { useEffect, useState } from 'react';

export default function AdminUsersPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Mặc định là true để load lần đầu

  // Hàm load dữ liệu chung
  const fetchUsers = async (searchQuery: string = '') => {
    setLoading(true);
    try {
        let res;
        if (searchQuery.trim()) {
            res = await searchUsers(searchQuery);
        } else {
            res = await getAllUsers();
        }
        setUsers(res);
    } catch (error) {
        console.error("Lỗi tải user:", error);
    } finally {
        setLoading(false);
    }
  };

  // 1. Load toàn bộ user khi mới vào trang
  useEffect(() => {
    fetchUsers();
  }, []);

  // Xử lý khi bấm nút tìm kiếm
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchUsers(query);
  };

  // Xử lý khi thay đổi role
  const handleChangeRole = async (userId: string, newRole: string) => {
      // Xác nhận hành động
      const confirmChange = confirm(
          newRole === 'BARBER' 
          ? `Bạn muốn thăng chức thành viên này thành THỢ CẮT TÓC (Barber)?` 
          : `Bạn có chắc muốn đổi quyền thành ${newRole}?`
      );
      
      if(!confirmChange) return;

      // Gọi Server Action
      const res = await updateUserRole(userId, newRole as Role);
      
      if (res.success) {
          alert('Đã cập nhật quyền thành công!');
          // Refresh list để cập nhật UI
          await fetchUsers(query); 
      } else {
          alert('Lỗi: ' + (res.error || 'Có lỗi xảy ra'));
      }
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
         <h2 className="text-3xl font-bold flex items-center gap-2">
            <UserCog className="w-8 h-8" />
            Quản lý User & Thợ
         </h2>
         <span className="text-gray-500 text-sm font-medium">Tổng: {users.length} tài khoản</span>
      </div>
      
      {/* Search Box */}
      <form onSubmit={handleSearch} className="mb-8 relative group">
        <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
        <input 
            type="text" 
            placeholder="Tìm theo SĐT, Tên hoặc Email..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-12 p-4 rounded-2xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-black outline-none transition-all"
        />
        <button 
            type="submit" 
            className="absolute right-2 top-2 bg-black text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-800 transition-transform active:scale-95"
        >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tìm kiếm'}
        </button>
      </form>

      {/* Kết quả */}
      <div className="space-y-4">
        {loading && users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 animate-spin text-gray-300 mb-2" />
                <p className="text-gray-500">Đang tải danh sách...</p>
            </div>
        )}
        
        {!loading && users.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">Không tìm thấy người dùng nào.</p>
            </div>
        )}
        
        {users.map((user) => (
            <div key={user.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl
                        ${user.role === 'ADMIN' ? 'bg-red-100 text-red-600' : 
                          user.role === 'BARBER' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                    `}>
                        {user.fullName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-lg text-gray-900">{user.fullName || 'Chưa đặt tên'}</p>
                            {user.role === 'BARBER' && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">THỢ</span>
                            )}
                             {user.role === 'ADMIN' && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">ADMIN</span>
                            )}
                        </div>
                        <p className="text-gray-500 text-sm font-medium flex gap-2">
                           <span>{user.phone}</span>
                           <span className="text-gray-300">|</span> 
                           <span className="truncate max-w-[150px]">{user.email || 'No Email'}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <Shield className="w-5 h-5 text-gray-400 ml-2" />
                    <select 
                        value={user.role} 
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        className={`
                            p-2 pr-8 rounded-lg font-bold text-sm border-none cursor-pointer outline-none bg-transparent focus:ring-0
                            ${user.role === 'ADMIN' ? 'text-red-600' : ''}
                            ${user.role === 'BARBER' ? 'text-blue-600' : ''}
                            ${user.role === 'USER' ? 'text-gray-700' : ''}
                        `}
                    >
                        <option value="USER">USER (Khách)</option>
                        <option value="BARBER">BARBER (Thợ)</option>
                        <option value="ADMIN">ADMIN (Chủ)</option>
                    </select>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}