// hooks/useQueueStatus.ts
'use client';

import { supabaseClient } from '@/lib/supabase/client';
import { QueueTicket } from '@/types/queue/types'; // Đảm bảo import đúng type
import { useEffect, useState } from 'react';

// Các trạng thái cần hiển thị trên màn hình
const ACTIVE_STATUSES = ['WAITING', 'CALLING', 'IN_PROGRESS', 'ASYNC_WAIT', 'OVERDUE'];

export function useQueueStatus() {
  const [queue, setQueue] = useState<QueueTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy ngày hôm nay định dạng YYYY-MM-DD
    // Lưu ý: new Date().toISOString() lấy giờ UTC, nên cẩn thận lệch múi giờ.
    // Tốt nhất dùng hàm này để lấy ngày theo giờ địa phương (VN)
    const todayStr = new Date().toLocaleDateString('en-CA'); // Trả về YYYY-MM-DD

    const fetchQueue = async () => {
      // Lưu ý: Tên bảng phải khớp chính xác với tên trong DB (do Prisma tạo)
      // Thường Prisma sẽ tạo bảng tên là "QueueTicket" (có hoa thường)
      const { data, error } = await supabaseClient
        .from('QueueTicket') 
        .select(`*`) // Lấy hết các trường cho tiện
        .eq('date', todayStr)
        .in('status', ACTIVE_STATUSES)
        .order('queueNumber', { ascending: true });

      if (error) {
        console.error('Lỗi lấy queue:', error.message);
      } else {
        console.log('Lấy queue thành công:', data);
        setQueue((data || []) as unknown as QueueTicket[]);
      }
      setLoading(false);
    };

    fetchQueue();

    // --- REALTIME SETUP ---
    const channel = supabaseClient
      .channel('queue-live')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'QueueTicket' // <--- SỬA LẠI: Phải khớp chính xác tên bảng trong DB (case-sensitive)
        },
        (payload) => {
            console.log('Realtime update:', payload);
            fetchQueue(); // Reload lại list khi có thay đổi
        }
      )
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  return { queue, loading };
}