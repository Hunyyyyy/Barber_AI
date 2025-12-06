// lib/validation.ts
import { z } from 'zod';

const passwordRules = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .max(100, 'Mật khẩu quá dài')
  // 1. Phải chứa ít nhất một chữ thường
  .regex(/[a-z]/, 'Mật khẩu phải chứa ít nhất một chữ cái thường')
  // 2. Phải chứa ít nhất một chữ hoa
  .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất một chữ cái in hoa')
  // 3. Phải chứa ít nhất một chữ số
  .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất một chữ số')
  // 4. Phải chứa ít nhất một ký tự đặc biệt
  .regex(/[!@#$%^&*]/, 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt (!@#$%^&*)');
export const SignUpSchema = z.object({
  name: z.string().min(2, 'Tên quá ngắn').max(50, 'Tên quá dài'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  password: passwordRules,
});

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export const UpdateUserSchema = z.object({
  fullName: z.string().min(2, 'Tên quá ngắn').max(50, 'Tên quá dài').optional(),
  phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ').optional(),
  avatarUrl: z.string().url('URL ảnh không hợp lệ').optional(),
  faceShape: z.enum(['ROUND', 'SQUARE', 'OVAL', 'HEART', 'DIAMOND']).optional(),
});