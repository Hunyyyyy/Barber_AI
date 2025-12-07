// lib/utils.ts
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};
export const cn = (...inputs: any[]) => {
  return inputs.filter(Boolean).join(' ');
};

