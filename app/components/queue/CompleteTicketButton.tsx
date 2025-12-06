// components/queue/CompleteTicketButton.tsx
'use client';

import { completeTicketAction } from '@/actions/queue.actions'; //
import { CheckCircle, Loader2 } from 'lucide-react';
import { useTransition } from 'react';

interface Props {
  ticketId: string;
}

export default function CompleteTicketButton({ ticketId }: Props) {
  // useTransition giúp quản lý trạng thái đang xử lý (loading) mà không chặn UI
  const [isPending, startTransition] = useTransition();

  const handleComplete = () => {
    // 1. Xác nhận trước khi làm (tránh bấm nhầm)
    const confirmed = window.confirm("Xác nhận đã cắt xong cho khách này?");
    if (!confirmed) return;

    // 2. Gọi Server Action
    startTransition(async () => {
      // Truyền new FormData() vì action của bạn yêu cầu tham số thứ 2 là FormData
      const result = await completeTicketAction(ticketId, new FormData());

      // 3. Xử lý kết quả
      if (!result.success) {
        // Nếu có lỗi từ server trả về -> Hiển thị Alert
        alert(`Lỗi: ${result.error}`);
      } else {
        // Thành công: Có thể hiện thông báo nhỏ hoặc để UI tự reload (do action đã revalidatePath)
        // alert("Đã hoàn thành!"); // (Tùy chọn)
      }
    });
  };

  return (
    <button 
      onClick={handleComplete}
      disabled={isPending} // Khóa nút khi đang chạy
      className={`
        px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 shadow-sm transition-colors
        ${isPending 
          ? 'bg-muted cursor-not-allowed text-muted-foreground' 
          : 'bg-green-600 hover:bg-green-700 text-white'
        }
      `}
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang lưu...</span>
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>Xong</span>
        </>
      )}
    </button>
  );
}