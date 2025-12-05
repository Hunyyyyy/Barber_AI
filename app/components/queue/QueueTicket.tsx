// components/queue/QueueTicket.tsx

import { CheckCircle2, QrCode, Scissors, Sparkles, X } from 'lucide-react';

// Nếu bạn dùng ID string từ DB thì có thể bỏ type strict Enum đi hoặc map lại
// Ở đây tôi dùng string cho linh hoạt
interface QueueTicketProps {
  queueNumber: number;
  customerName: string;
  services: string[]; // Danh sách tên dịch vụ hoặc ID
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
  services,
  estimatedTime,
  position,
  status,
  onCancel,
}: QueueTicketProps) {
  
  // Kiểm tra trạng thái "Đang làm"
  const isServing = ['SERVING', 'PROCESSING', 'FINISHING', 'IN_PROGRESS'].includes(status || '');
  const isCalling = status === 'CALLING';

  // Helper hiển thị tên dịch vụ (nếu services là ID thì map, nếu là tên rồi thì in ra)
  const renderServices = () => {
    return services.map(s => SERVICE_NAMES[s] || s).join(', ');
  };

  return (
    <div className={`
      border-2 rounded-3xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm mx-auto mt-8 relative transition-colors duration-300
      ${isServing ? 'bg-blue-50 border-blue-900' : 'bg-white border-black'}
    `}>
      <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full border-b-2 
        ${isServing ? 'bg-blue-100 border-blue-900' : 'bg-gray-50 border-black'}
      `}></div>

      <div className={`text-center space-y-2 mb-6 border-b-2 border-dashed pb-6 
        ${isServing ? 'border-blue-200' : 'border-gray-200'}
      `}>
        <p className="text-gray-500 uppercase tracking-widest text-xs font-semibold">
          {isServing ? 'Đang phục vụ số' : 'Số thứ tự của bạn'}
        </p>
        <h1 className={`text-7xl font-black tracking-tighter ${isServing ? 'text-blue-900' : 'text-black'}`}>
          #{queueNumber.toString().padStart(2, '0')}
        </h1>

        {/* Chỉ hiện thời gian dự kiến nếu đang chờ */}
        {!isServing && estimatedTime && (
          <div className="inline-block bg-gradient-to-r from-emerald-100 to-green-100 px-4 py-2 rounded-full border border-emerald-200">
            <p className="text-sm font-bold text-emerald-800">
              Dự kiến: {estimatedTime}
            </p>
          </div>
        )}

        {/* Chỉ hiện vị trí nếu đang chờ và vị trí > 0 */}
        {!isServing && position !== undefined && position > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            Còn <strong className="text-xl text-orange-600">{position}</strong> người trước bạn
          </p>
        )}

        {/* Hiển thị trạng thái đang làm việc */}
        {isServing && (
          <div className="flex items-center justify-center gap-2 text-blue-700 font-bold mt-2 animate-pulse">
            <Scissors className="w-5 h-5" />
            <span>Thợ đang thực hiện</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Khách hàng</span>
          <span className="font-semibold">{customerName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Dịch vụ</span>
          <span className="font-semibold text-right max-w-[60%] line-clamp-2">
            {renderServices()}
          </span>
        </div>

        {/* Status Box */}
        {status && status !== 'WAITING' && (
          <div className={`rounded-xl p-3 text-center border
            ${isCalling ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : ''}
            ${isServing ? 'bg-blue-100 border-blue-200 text-blue-800' : ''}
            ${status === 'OVERDUE' ? 'bg-red-50 border-red-200 text-red-800' : ''}
          `}>
            <p className="text-sm font-bold flex items-center justify-center gap-2">
              {isCalling && '🔊 Đang được gọi đến quầy!'}
              {status === 'SERVING' && <><Scissors className="w-4 h-4"/> Đang cắt tóc / thực hiện</>}
              {status === 'PROCESSING' && <><Sparkles className="w-4 h-4"/> Đang ngấm thuốc / chờ</>}
              {status === 'FINISHING' && <><CheckCircle2 className="w-4 h-4"/> Đang hoàn thiện / sấy</>}
              {status === 'OVERDUE' && 'Quá giờ dự kiến – Vui lòng đến ngay!'}
            </p>
          </div>
        )}

        <div className="flex justify-center py-6">
          <QrCode className={`w-40 h-40 ${isServing ? 'text-blue-900' : 'text-black'}`} />
        </div>
        <p className="text-center text-xs text-gray-400">
          {isServing ? 'Chúc quý khách có trải nghiệm tuyệt vời!' : 'Đưa mã QR này cho nhân viên khi đến lượt'}
        </p>
      </div>

      {/* Chỉ hiện nút Hủy khi chưa đến lượt (WAITING) */}
      {!isServing && !isCalling && (
        <div className="mt-6 pt-4 border-t-2 border-gray-100">
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-xl border-2 border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            <span>Hủy vé chờ</span>
          </button>
        </div>
      )}
    </div>
  );
}