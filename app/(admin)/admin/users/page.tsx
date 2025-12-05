'use client';
import { searchUsers, updateUserRole } from '@/actions/admin.actions';
import { Role } from '@prisma/client';
import { Search, Shield } from 'lucide-react';
import { useState } from 'react';

export default function AdminUsersPage() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await searchUsers(query);
    setUsers(res);
    setLoading(false);
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
      const confirmChange = confirm(`Bạn có chắc muốn đổi quyền thành ${newRole}?`);
      if(!confirmChange) return;

      await updateUserRole(userId, newRole as Role);
      alert('Đã cập nhật quyền thành công');
      // Refresh list
      const res = await searchUsers(query);
      setUsers(res);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Quản lý & Phân quyền User</h2>
      
      {/* Search Box */}
      <form onSubmit={handleSearch} className="mb-8 relative">
        <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
        <input 
            type="text" 
            placeholder="Tìm theo SĐT, Tên hoặc Email..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-12 p-4 rounded-2xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-black outline-none"
        />
        <button type="submit" className="absolute right-2 top-2 bg-black text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-800">
            Tìm kiếm
        </button>
      </form>

      {/* Kết quả */}
      <div className="space-y-4">
        {loading && <p className="text-center text-gray-500">Đang tìm kiếm...</p>}
        
        {users.map((user) => (
            <div key={user.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-xl text-gray-600">
                        {user.fullName?.[0] || 'U'}
                    </div>
                    <div>
                        <p className="font-bold text-lg">{user.fullName || 'Chưa đặt tên'}</p>
                        <p className="text-gray-500 text-sm">{user.phone} • {user.email || 'No Email'}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <select 
                        value={user.role} 
                        onChange={(e) => handleChangeRole(user.id, e.target.value)}
                        className={`p-2 rounded-lg font-bold text-sm border-none bg-gray-50 cursor-pointer
                            ${user.role === 'ADMIN' ? 'text-red-600 bg-red-50' : ''}
                            ${user.role === 'BARBER' ? 'text-blue-600 bg-blue-50' : ''}
                        `}
                    >
                        <option value="USER">USER (Khách)</option>
                        <option value="BARBER">BARBER (Thợ)</option>
                        <option value="ADMIN">ADMIN (Chủ)</option>
                    </select>
                </div>
            </div>
        ))}

        {!loading && users.length === 0 && query && (
            <p className="text-center text-gray-400 mt-8">Không tìm thấy người dùng nào.</p>
        )}
      </div>
    </div>
  );
}