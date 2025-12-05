// lib/queue/queue-cleanup.ts
import { prisma } from '@/lib/supabase/prisma/db';
import type { QueueStatus } from '@/types/queue/types';

const OVERDUE_THRESHOLD_MINUTES = 90; // Có thể tùy chỉnh sau

export async function cleanupOverdueTickets() {
  const now = new Date();
  const threshold = new Date(now.getTime() - OVERDUE_THRESHOLD_MINUTES * 60 * 1000);

  const overdueTickets = await prisma.queueTicket.findMany({
    where: {
      status: { in: ['IN_PROGRESS', 'ASYNC_WAIT', 'COMPLETED'] },
      startedAt: { lt: threshold },
      paidAt: null,
    },
  });

  for (const ticket of overdueTickets) {
    await prisma.queueTicket.update({
      where: { id: ticket.id },
      data: {
        status: 'OVERDUE' as QueueStatus,
      },
    });

    // Có thể gửi thông báo realtime cho admin ở đây
    console.log(`Ticket ${ticket.queueNumber} marked as OVERDUE`);
  }

  return { cleaned: overdueTickets.length };
}