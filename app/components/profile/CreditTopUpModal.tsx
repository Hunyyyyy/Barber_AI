'use client';

import { formatCurrency } from '@/lib/utils';
import { Copy, X } from 'lucide-react';
import { useState } from 'react';

// Cấu hình ngân hàng (Giống file PaymentModal.tsx cũ)
const BANK_ID = 'MB'; 
const ACCOUNT_NO = '0795516929'; 
const ACCOUNT_NAME = 'Ngo Nhat Huy'; 
const TEMPLATE = 'compact2'; 

interface Props {
  user: any;
  onClose: () => void;
}

const PACKAGES = [
    { credits: 5, price: 5000, label: 'Gói Dùng Thử' }, // Giá/Credit: 3.000 VNĐ
    { credits: 10, price: 25000, label: 'Gói Cơ Bản' }, // Giá/Credit: 2.500 VNĐ
    { credits: 25, price: 50000, label: 'Gói Phổ Thông', popular: true }, // Giá/Credit: 2.000 VNĐ
    { credits: 50, price: 90000, label: 'Gói Cao Cấp' }, // Giá/Credit: 1.800 VNĐ
    { credits: 100, price: 180000, label: 'Gói Siêu VIP' }, // Giá/Credit: 1.800 VNĐ
];
export default function CreditTopUpModal({ user, onClose }: Props) {
  const [step, setStep] = useState(1); // 1: Chọn gói, 2: Quét QR
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  
  // Giả lập mã giao dịch: NAP + Timestamp (Thực tế nên lấy ID từ DB)
  // Trong route.ts của bạn xử lý regex: /NAP\d+/i
  const [transCode] = useState(`NAP${Math.floor(Date.now() / 1000)}`); 

  // URL QR Code
  const qrImgUrl = selectedPkg 
    ? `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?amount=${selectedPkg.price}&addInfo=${transCode}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
    : '';

  const handleSelectPackage = (pkg: any) => {
    setSelectedPkg(pkg);
    // TODO: Tại đây nên gọi Server Action để tạo bản ghi 'CreditTransaction' với status 'PENDING'
    // await createCreditTransaction({ amount: pkg.price, credits: pkg.credits, code: transCode });
    setStep(2);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg">
            {step === 1 ? 'Chọn gói nạp' : 'Thanh toán'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5"/></button>
        </div>

        {/* STEP 1: CHỌN GÓI */}
        {step === 1 && (
            <div className="p-6 space-y-3 overflow-y-auto">
                {PACKAGES.map((pkg, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => handleSelectPackage(pkg)}
                        className={`relative border-2 rounded-2xl p-4 cursor-pointer transition hover:border-black hover:bg-gray-50 ${pkg.popular ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}
                    >
                        {pkg.popular && (
                            <span className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">Phổ biến</span>
                        )}
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-gray-900">{pkg.label}</h4>
                                <p className="text-sm text-gray-500">+{pkg.credits} lượt tạo</p>
                            </div>
                            <div className="text-lg font-black">{formatCurrency(pkg.price)}</div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* STEP 2: QUÉT QR */}
        {step === 2 && (
             <div className="p-6 overflow-y-auto flex flex-col items-center animate-in slide-in-from-right-8 duration-300">
                <div className="bg-white p-2 border-2 border-black rounded-2xl shadow-lg w-full max-w-[220px] mb-4">
                    <img src={qrImgUrl} alt="QR Code" className="w-full h-auto rounded-xl" />
                </div>
                
                <div className="text-center mb-6">
                    <p className="text-gray-500 text-xs font-bold uppercase">Số tiền cần chuyển</p>
                    <p className="text-3xl font-black text-blue-600">{formatCurrency(selectedPkg.price)}</p>
                </div>

                <div className="w-full bg-yellow-50 p-4 rounded-xl border border-yellow-200 space-y-3 mb-4">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-yellow-800 font-medium">Nội dung chuyển khoản (Bắt buộc):</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-yellow-300 p-2 rounded-lg">
                        <span className="font-mono font-black text-lg flex-1 text-center text-black">{transCode}</span>
                        <button onClick={() => navigator.clipboard.writeText(transCode)} className="p-2 hover:bg-gray-100 rounded-md">
                            <Copy className="w-4 h-4 text-gray-500"/>
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-yellow-700">Hệ thống sẽ tự động cộng Credits sau khi nhận được tiền (1-3 phút).</p>
                </div>

                <button 
                    onClick={() => setStep(1)}
                    className="text-sm text-gray-500 hover:text-black underline"
                >
                    Chọn gói khác
                </button>
             </div>
        )}
      </div>
    </div>
  );
}