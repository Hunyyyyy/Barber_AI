// app/types/history.ts
import { TicketStatus } from "@prisma/client";

// 1. Type cho Lịch sử đặt lịch (Booking)
export interface BookingHistoryItem {
  id: string;
  ticketNumber: number;
  date: Date;
  status: TicketStatus; // Dùng Enum có sẵn của Prisma
  totalPrice: number;
  barber: {
    id: string;
    name: string;
  } | null;
  services: {
    priceSnapshot: number;
    service: {
      name: string;
    };
  }[];
}

// 2. Type cho Lịch sử giao dịch (Transaction)
export interface TransactionHistoryItem {
  id: string;
  code: string;
  amount: number;
  credits: number;
  status: string;
  createdAt: Date;
}

// 3. Type cho Lịch sử AI (AI Analysis)
export interface AIHistoryItem {
  id: string;
  originalImageUrl: string;
  createdAt: Date;
  analysisResult: any; // Hoặc định nghĩa chi tiết hơn nếu muốn
  generatedStyles: {
    id: string;
    styleName: string;
    generatedImageUrl: string;
  }[];
}

// 4. Type cho Bộ sưu tập (Collection)
export interface CollectionItem {
  id: string;
  styleName: string;
  imageUrl: string;
  createdAt: Date;
}