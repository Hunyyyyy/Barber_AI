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
export const updateShopSettingsSchema = z.object({
  // Thời gian
  morningOpen: z.string().regex(/^\d{2}:\d{2}$/, 'Thời gian mở cửa không hợp lệ').optional().nullable(),
  morningClose: z.string().regex(/^\d{2}:\d{2}$/, 'Thời gian đóng cửa không hợp lệ').optional().nullable(),
  afternoonOpen: z.string().regex(/^\d{2}:\d{2}$/, 'Thời gian mở cửa không hợp lệ').optional().nullable(),
  afternoonClose: z.string().regex(/^\d{2}:\d{2}$/, 'Thời gian đóng cửa không hợp lệ').optional().nullable(),
  announcementText: z.string().max(500, 'Nội dung thông báo quá dài').optional().nullable(),
  isAnnouncementShow: z.boolean().optional(),


  // Vé/Khách hàng
  maxDailyTickets: z.coerce.number().int("Số lượng khách phải là số nguyên").min(1, 'Số lượng khách tối đa phải lớn hơn 0').optional(),
  
  // Trạng thái (đã chuyển sang xử lý thủ công vì là checkbox)
  // isShopOpen: z.boolean().optional(),

  // Thông tin Ngân hàng
  bankName: z.string().min(2, 'Tên ngân hàng quá ngắn').max(10, 'Tên ngân hàng quá dài').optional().nullable(),
  bankAccountNo: z.string().min(2, 'Số tài khoản quá ngắn').max(20, 'Số tài khoản quá dài').optional().nullable(),
  bankAccountName: z.string().min(2, 'Tên chủ tài khoản quá ngắn').max(50, 'Tên chủ tài khoản quá dài').optional().nullable(),

  // Mẫu QR Code
  qrTemplate: z.string().min(2, 'Mẫu QR không hợp lệ').max(20, 'Mẫu QR quá dài').optional().nullable(), // <--- Thêm trường Mẫu QR
});
export const serviceSchema = z.object({
  // ID chỉ cần thiết khi update, nên là optional
  id: z.string().optional(), 
  
  // Tên dịch vụ: Bắt buộc, tối thiểu 3 ký tự, tối đa 100
  name: z.string()
    .min(3, 'Tên dịch vụ phải có ít nhất 3 ký tự')
    .max(100, 'Tên dịch vụ quá dài'),
    
  // Giá: Chuyển đổi thành số, là số nguyên không âm
  price: z.coerce.number()
    .int('Giá tiền phải là số nguyên')
    .min(0, 'Giá tiền không được âm'),
    
  // Thời gian làm: Chuyển đổi thành số, là số nguyên dương (phút)
  durationWork: z.coerce.number()
    .int('Thời gian làm phải là số nguyên')
    .min(1, 'Thời gian làm phải lớn hơn 0 phút'), 
    
  // Thời gian chờ: Chuyển đổi thành số, là số nguyên không âm (phút), mặc định là 0
  durationWait: z.coerce.number()
    .int('Thời gian chờ phải là số nguyên')
    .min(0, 'Thời gian chờ không được âm')
    .optional()
    .default(0),

  // Trạng thái: Kiểm tra boolean.
  // Vì FormData.get('isActive') chỉ trả về 'on' hoặc null, ta xử lý logic này trong hàm.
  // Tuy nhiên, nếu bạn muốn đưa vào Zod để kiểm tra form, thì nó cần được xác định là optional/boolean.
});