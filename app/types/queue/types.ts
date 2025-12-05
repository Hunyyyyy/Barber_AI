// lib/queue/types.ts
export type ServiceType = 
  | "CUT"
  | "WASH"
  | "EAR_CLEANING"
  | "PERM"
  | "DYE"
  | "STYLE"
  | "SHAVE";

export type QueueStatus =
  | "WAITING"      // Chưa tới quán
  | "CALLING"      // Đã gọi, đang trên đường
  | "IN_PROGRESS"  // Đang được thợ phục vụ
  | "ASYNC_WAIT"   // Đang chờ thuốc ngấm (thợ rảnh)
  | "OVERDUE"      // Quá thời gian dự kiến → báo động
  | "COMPLETED"    // Đã làm xong, chờ thanh toán
  | "PAID"         // Đã thanh toán → xóa khỏi hàng đợi realtime
  | "CANCELLED";   // Hủy

export type QueueTicket = {
  id: string;
  queueNumber: number;
  date: string; // ISO date string (YYYY-MM-DD)
  status: QueueStatus;
  customerName: string;
  phone: string;
  services: ServiceType[];
  estimatedDuration: number;
  joinedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  paidAt?: string | null;
  assignedBarberId?: string | null;
  barberName?: string | null;
};

export type ShopSettings = {
  maxConcurrent: number;
  maxDailyCapacity: number;
  morningOpenTime: string;
  morningCloseTime: string;
  afternoonOpenTime: string;
  afternoonCloseTime: string;
  durations: Record<ServiceType, number>;
  costTable: Record<ServiceType, number>;
};