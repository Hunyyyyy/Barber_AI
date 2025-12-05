// lib/validation.ts
import { z } from 'zod';

export const SignUpSchema = z.object({
  name: z.string().min(2, 'Tên quá ngắn'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
});

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});