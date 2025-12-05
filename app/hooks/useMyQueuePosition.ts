// hooks/useMyQueuePosition.ts
'use client';

import { supabaseClient } from '@/lib/supabase/client';
import type { QueueTicket } from '@/types/queue/types';
import { useEffect, useState } from 'react';

export function useMyQueuePosition(phone: string | null, waitForUser: boolean = false) {
  const [myTicket, setMyTicket] = useState<QueueTicket | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    // 1. Đang đợi user hoặc metadata -> Luôn Loading
    if (waitForUser) {
      if (isMounted) setLoading(true);
      return;
    }

    // 2. User đã load xong, nhưng không có phone -> Chốt là Guest -> Tắt Loading
    if (!phone) {
      if (isMounted) {
        setMyTicket(null);
        setPosition(null);
        setLoading(false);
      }
      return;
    }

    // 3. Có phone -> Fetch vé
    const fetchMyTicket = async () => {
      // Quan trọng: Đảm bảo set loading true trước khi fetch
      if (isMounted) setLoading(true);

      try {
        const { data, error } = await supabaseClient
          .from('QueueTicket')
          .select('*')
          .eq('phone', phone)
          .in('status', ['WAITING', 'CALLING', 'IN_PROGRESS', 'ASYNC_WAIT'])
          .maybeSingle();

        if (error) console.log('Lỗi lấy vé:', error);

        if (isMounted) {
          if (data) {
            setMyTicket(data);
            await calculatePosition(data.queueNumber, data.date); 
          } else {
            setMyTicket(null);
            setPosition(null);
            // Nếu không có vé thì tắt loading ngay tại đây
             setLoading(false);
          }
        }
      } catch (err) {
        console.log(err);
        if (isMounted) {
            setMyTicket(null);
            setPosition(null);
            setLoading(false);
        }
      } 
      // Lưu ý: Không để finally setLoading(false) ở đây vì hàm calculatePosition là async bên dưới
      // Nếu có vé, loading sẽ được tắt sau khi calculatePosition xong (hoặc bạn có thể handle riêng)
      // Để đơn giản và an toàn, ta move logic setLoading(false) vào từng block
    };

    const calculatePosition = async (myNumber: number, dateStr: string) => {
      try {
        const { count } = await supabaseClient
            .from('QueueTicket')
            .select('*', { count: 'exact', head: true })
            .lt('queueNumber', myNumber)
            .eq('date', dateStr)
            .in('status', ['WAITING', 'CALLING', 'IN_PROGRESS', 'ASYNC_WAIT']);

        if (isMounted) setPosition((count || 0) + 1);
      } catch (error) {
        console.log(error);
      } finally {
        // Fetch xong vị trí mới được coi là load xong hoàn toàn
        if (isMounted) setLoading(false);
      }
    };

    fetchMyTicket();

    const channel = supabaseClient
      .channel('queue-my-position')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'QueueTicket' }, () => {
        fetchMyTicket();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabaseClient.removeChannel(channel);
    };
  }, [phone, waitForUser]); 

  return { myTicket, position, loading };
}