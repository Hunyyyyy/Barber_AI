// components/queue/QueueTicket.tsx
import { Clock, QrCode, Scissors, Sparkles, X } from 'lucide-react';

interface QueueTicketProps {
  queueNumber: number;
  customerName: string;
  avatarUrl?: string | null; // [MỚI] Thêm prop Avatar
  services: string[];
  estimatedTime?: string;
  position?: number;
  status?: string;
  onCancel: () => void;
}

const SERVICE_NAMES: Record<string, string> = {
  CUT: 'Cắt tóc nam',
  WASH: 'Gội đầu massage',
  SHAVE: 'Cạo mặt / Ráy tai',
  PERM: 'Uốn tóc',
  DYE: 'Nhuộm tóc',
  STYLE: 'Tạo kiểu',
  EAR_CLEANING: 'Ráy tai',
};

export default function QueueTicket({
  queueNumber,
  customerName,
  avatarUrl,
  services,
  estimatedTime,
  position,
  status,
  onCancel,
}: QueueTicketProps) {
  
  const isServing = ['SERVING', 'PROCESSING', 'FINISHING', 'IN_PROGRESS'].includes(status || '');
  const isCalling = status === 'CALLING';
  const isWaiting = status === 'WAITING';

  // Lấy chữ cái đầu làm Avatar mặc định
  const initial = customerName.charAt(0).toUpperCase();

  return (
    <div className="relative w-full max-w-sm mx-auto drop-shadow-2xl font-sans">
      
      {/* --- PHẦN TRÊN CỦA VÉ --- */}
      <div className={`
        relative rounded-t-3xl p-6 pb-8 transition-colors duration-500 overflow-hidden
        ${isServing ? 'bg-black text-white' : 'bg-white text-black border-x border-t border-neutral-200'}
      `}>
        {/* Họa tiết trang trí nền */}
        <div className={`absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 rounded-full blur-3xl opacity-10 ${isServing ? 'bg-white' : 'bg-black'}`}></div>

        {/* Header Vé */}
        <div className="relative z-10 flex justify-between items-start mb-8">
            <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isServing ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    SỐ THỨ TỰ
                </p>
                <h1 className="text-7xl font-black tracking-tighter leading-none">
                    #{queueNumber.toString().padStart(2, '0')}
                </h1>
            </div>
            
            {/* Badge Trạng thái (Monochrome) */}
            <div className={`
                px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 border
                ${isServing 
                    ? 'bg-white text-black border-white' 
                    : isCalling
                        ? 'bg-black text-white border-black animate-pulse'
                        : 'bg-neutral-100 text-neutral-600 border-neutral-200'}
            `}>
                {isServing && <Scissors className="w-3.5 h-3.5" />}
                {isCalling && <Sparkles className="w-3.5 h-3.5" />}
                {isWaiting && <Clock className="w-3.5 h-3.5" />}
                <span className="uppercase tracking-wider text-[10px]">
                    {isServing ? 'Serving' : isCalling ? 'Calling' : 'Waiting'}
                </span>
            </div>
        </div>

        {/* Thông tin khách hàng & Dịch vụ */}
        <div className="relative z-10 space-y-6">
            
            {/* [MỚI] Avatar & Tên */}
            <div className={`flex items-center gap-4 p-4 rounded-2xl border ${isServing ? 'bg-white/10 border-white/10' : 'bg-neutral-50 border-neutral-100'}`}>
                <div className="relative shrink-0">
                    <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border-2 ${isServing ? 'bg-black border-neutral-700' : 'bg-white border-neutral-200'}`}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={customerName} className="w-full h-full object-cover" />
                        ) : (
                            <span className={`font-black text-lg ${isServing ? 'text-white' : 'text-black'}`}>{initial}</span>
                        )}
                    </div>
                    {/* Online indicator */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                
                <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider opacity-60`}>Khách hàng</p>
                    <p className="font-bold text-lg leading-tight truncate max-w-[180px]">{customerName}</p>
                </div>
            </div>

            {/* Dịch vụ */}
            <div className="space-y-2">
                <p className={`text-[10px] font-bold uppercase tracking-wider opacity-50`}>Dịch vụ</p>
                <div className="flex flex-wrap gap-2">
                    {services.map((s, i) => (
                        <span key={i} className={`
                            px-3 py-1.5 rounded text-xs font-bold border uppercase tracking-wide
                            ${isServing 
                                ? 'bg-white text-black border-white' 
                                : 'bg-black text-white border-black'}
                        `}>
                            {SERVICE_NAMES[s] || s}
                        </span>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* --- ĐƯỜNG CẮT RĂNG CƯA --- */}
      <div className="relative h-6 bg-transparent overflow-hidden flex items-center">
         <div className={`absolute -left-3 w-6 h-6 rounded-full z-20 ${isServing ? 'bg-neutral-100' : 'bg-gray-100'}`}></div>
         <div className={`absolute -right-3 w-6 h-6 rounded-full z-20 ${isServing ? 'bg-neutral-100' : 'bg-gray-100'}`}></div>
         <div className={`w-full h-[2px] mx-5 border-t-2 border-dashed opacity-30 ${isServing ? 'border-white' : 'border-black'}`}></div>
         <div className={`absolute inset-0 z-0 ${isServing ? 'bg-black' : 'bg-white border-x border-neutral-200'}`}></div>
      </div>

      {/* --- PHẦN DƯỚI CỦA VÉ (QR & ACTION) --- */}
      <div className={`
        rounded-b-3xl p-6 pt-2 transition-colors duration-500 flex flex-col items-center gap-6
        ${isServing ? 'bg-black text-white' : 'bg-white text-black border-x border-b border-neutral-200'}
      `}>
        
        {/* QR Code Style */}
        <div className="p-3 bg-white rounded-xl shadow-sm border border-neutral-200">
            <QrCode className="w-32 h-32 text-black" />
        </div>
        
        <p className={`text-center text-[10px] uppercase tracking-widest opacity-50 font-medium`}>
          {isServing ? 'Thanks for using our service' : 'Show this QR at counter'}
        </p>

        {/* Nút Hủy (Style tối giản) */}
        {!isServing && !isCalling && (
            <button
                onClick={onCancel}
                className="w-full py-4 rounded-xl border border-neutral-200 hover:border-black hover:bg-black hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group"
            >
                <X className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Hủy vé</span>
            </button>
        )}
      </div>
    </div>
  );
}