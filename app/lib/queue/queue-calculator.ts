// lib/queue/queue-calculator.ts
import { prisma } from '@/lib/supabase/prisma/db';
import type { ServiceType, ShopSettings } from '@/types/queue/types';

let cachedSettings: ShopSettings | null = null;
async function getShopSettings(): Promise<ShopSettings> {
  if (cachedSettings) return cachedSettings;
  const settings = await prisma.shopSetting.findUnique({ where: { id: '1' } });
  if (!settings) throw new Error('Shop settings not found');
  cachedSettings = {
    maxConcurrent: settings.maxConcurrent,
    maxDailyCapacity: settings.maxDailyCapacity,
    morningOpenTime: settings.morningOpenTime,
    morningCloseTime: settings.morningCloseTime,
    afternoonOpenTime: settings.afternoonOpenTime,
    afternoonCloseTime: settings.afternoonCloseTime,
    durations: settings.durations as Record<ServiceType, number>,
    costTable: settings.costTable as Record<ServiceType, number>,
  };
  return cachedSettings;
}

export async function calculateEstimatedWaitTime(
  selectedServices: ServiceType[]
): Promise<{ minutes: number; message: string }> {
  const settings = await getShopSettings();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeTickets = await prisma.queueTicket.findMany({
    where: {
      date: today,
      status: { in: ['WAITING', 'CALLING', 'IN_PROGRESS', 'ASYNC_WAIT'] },
    },
    orderBy: { queueNumber: 'asc' },
  });

  // Tổng thời gian của tất cả khách đang chờ + đang làm
  const totalMinutesAhead = activeTickets.reduce((sum, t) => sum + t.estimatedDuration, 0);

  // Thời gian của khách mới
  const ownDuration = selectedServices.reduce(
    (sum, s) => sum + (settings.durations[s] || 30),
    0
  );

  // Ước tính thời gian chờ = thời gian khách trước + nửa thời gian mình (vì mình sẽ ở giữa)
  const estimatedMinutes = Math.ceil(totalMinutesAhead + ownDuration / 2);

  let message = '';
  if (estimatedMinutes < 10) message = 'Quán đang vắng, bạn sẽ được phục vụ ngay!';
  else if (estimatedMinutes < 30) message = 'Quán hơi đông một chút, nhưng vẫn ổn!';
  else if (estimatedMinutes < 60) message = 'Quán đang đông, bạn nên chờ một chút nhé.';
  else message = 'Quán đang rất đông, bạn có thể cân nhắc đến sau hoặc chờ lâu hơn.';

  return { minutes: estimatedMinutes, message };
}

export async function canJoinQueue(): Promise<{ allowed: boolean; reason?: string }> {
  const settings = await getShopSettings();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyCount = await prisma.queueTicket.count({
    where: {
      date: today,
      status: { notIn: ['CANCELLED', 'PAID'] },
    },
  });

  if (dailyCount >= settings.maxDailyCapacity) {
    return { allowed: false, reason: 'Đã đạt giới hạn khách trong ngày' };
  }

  const concurrentCount = await prisma.queueTicket.count({
    where: {
      date: today,
      status: { in: ['CALLING', 'IN_PROGRESS', 'ASYNC_WAIT'] },
    },
  });

  if (concurrentCount >= settings.maxConcurrent) {
    return { allowed: false, reason: 'Quán hiện đang đầy, vui lòng đợi có chỗ trống' };
  }

  return { allowed: true };
}