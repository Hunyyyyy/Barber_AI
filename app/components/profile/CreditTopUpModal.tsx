// components/profile/CreditTopUpModal.tsx
'use client';
import { createTopUpOrder } from '@/actions/credit.actions';
import { formatCurrency } from '@/lib/utils';
import { Copy, X } from 'lucide-react';
import { useState } from 'react';

const BANK_ID = 'MB'; 
const ACCOUNT_NO = '0795516929'; 
const ACCOUNT_NAME = 'Ngo Nhat Huy'; 
const TEMPLATE = 'compact2'; 

interface Props {
  user: any;
  onClose: () => void;
}

const PACKAGES = [
    { credits: 5, price: 5000, label: 'Gói Dùng Thử' }, 
    { credits: 10, price: 25000, label: 'Gói Cơ Bản' }, 
    { credits: 25, price: 50000, label: 'Gói Phổ Thông', popular: true }, 
    { credits: 50, price: 90000, label: 'Gói Cao Cấp' }, 
    { credits: 100, price: 180000, label: 'Gói Siêu VIP' }, 
];

export default function CreditTopUpModal({ user, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transCode, setTransCode] = useState('');

  const qrImgUrl = selectedPkg 
    ? `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-${TEMPLATE}.png?amount=${selectedPkg.price}&addInfo=${transCode}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`
    : '';

  const handleSelectPackage = async (pkg: any) => {
    try {
        setIsLoading(true);
        setSelectedPkg(pkg);
        const res = await createTopUpOrder(pkg.price, pkg.credits);

        if (res.success && res.order) {
            setTransCode(res.order.code);
            setStep(2);
        } else {
            alert("Lỗi tạo đơn nạp, vui lòng thử lại!");
        }
    } catch (error) {
        console.error(error);
        alert("Lỗi kết nối!");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      {/* SỬA: bg-card, text-card-foreground */}
      <div className="bg-card rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
          <h3 className="font-bold text-lg text-foreground">
            {step === 1 ? 'Chọn gói nạp' : 'Thanh toán'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition"><X className="w-5 h-5"/></button>
        </div>

        {/* STEP 1: CHỌN GÓI */}
        {step === 1 && (
            <div className="p-6 space-y-3 overflow-y-auto">
                {PACKAGES.map((pkg, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => handleSelectPackage(pkg)}
                        className={`relative border-2 rounded-2xl p-4 cursor-pointer transition 
                            ${pkg.popular 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                : 'border-border hover:border-foreground bg-card hover:bg-accent'
                            }
                        `}
                    >
                        {pkg.popular && (
                            <span className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase shadow-sm">Phổ biến</span>
                        )}
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-foreground">{pkg.label}</h4>
                                <p className="text-sm text-muted-foreground">+{pkg.credits} lượt tạo</p>
                            </div>
                            <div className="text-lg font-black text-foreground">{formatCurrency(pkg.price)}</div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* STEP 2: QUÉT QR */}
        {step === 2 && (
             <div className="p-6 overflow-y-auto flex flex-col items-center animate-in slide-in-from-right-8 duration-300">
                <div className="bg-white p-2 border-2 border-black rounded-2xl shadow-lg w-full max-w-[220px] mb-4">
                    <img src={qrImgUrl} alt="QR Code" className="w-full h-auto rounded-xl object-contain" />
                </div>
                
                <div className="text-center mb-6">
                    <p className="text-muted-foreground text-xs font-bold uppercase">Số tiền cần chuyển</p>
                    <p className="text-3xl font-black text-primary">{formatCurrency(selectedPkg.price)}</p>
                </div>

                <div className="w-full bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 space-y-3 mb-4">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-yellow-800 dark:text-yellow-400 font-medium">Nội dung chuyển khoản (Bắt buộc):</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-black border border-yellow-300 dark:border-yellow-700 p-2 rounded-lg">
                        <span className="font-mono font-black text-lg flex-1 text-center text-black dark:text-white select-all">{transCode}</span>
                        <button onClick={() => navigator.clipboard.writeText(transCode)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md">
                            <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400"/>
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-yellow-700 dark:text-yellow-500">Hệ thống sẽ tự động cộng Credits sau khi nhận được tiền (1-3 phút).</p>
                </div>

                <button 
                    onClick={() => setStep(1)}
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                    Chọn gói khác
                </button>
             </div>
        )}
      </div>
    </div>
  );
}