// components/queue/QueueTicket.tsx
import { Clock, QrCode, Scissors, Sparkles, X } from 'lucide-react';

interface QueueTicketProps {
  queueNumber: number;
  customerName: string;
  avatarUrl?: string | null;
  services: string[];
  estimatedTime?: string;
  position?: number;
  status?: string;
  onCancel: () => void;
}

const SERVICE_NAMES: Record<string, string> = {
  CUT: 'Cắt tóc',
  WASH: 'Gội đầu',
  SHAVE: 'Cạo/Ráy',
  PERM: 'Uốn',
  DYE: 'Nhuộm',
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
  const initial = customerName.charAt(0).toUpperCase();

  return (
    <div className="relative w-full max-w-[340px] md:max-w-sm mx-auto drop-shadow-2xl font-sans my-4">
      
      {/* --- TOP SECTION --- */}
      <div className={`
        relative rounded-t-2xl md:rounded-t-3xl p-5 md:p-6 pb-8 overflow-hidden transition-colors
        ${isServing ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground border-x border-t border-border'}
      `}>
        {/* Abstract BG */}
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 -mr-10 -mt-10 ${isServing ? 'bg-white' : 'bg-black'}`}></div>

        {/* Header */}
        <div className="relative z-10 flex justify-between items-start mb-6">
            <div>
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${isServing ? 'opacity-70' : 'text-muted-foreground'}`}>
                    SỐ THỨ TỰ
                </p>
                {/* Responsive Text Size */}
                <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-none">
                    #{queueNumber.toString().padStart(2, '0')}
                </h1>
            </div>
            
            <div className={`
                px-2.5 py-1 rounded-md font-bold text-[10px] flex items-center gap-1.5 border shadow-sm
                ${isServing 
                    ? 'bg-background text-foreground border-transparent' 
                    : isCalling
                        ? 'bg-primary text-primary-foreground border-transparent animate-pulse'
                        : 'bg-secondary text-secondary-foreground border-border'}
            `}>
                {isServing && <Scissors className="w-3 h-3" />}
                {isCalling && <Sparkles className="w-3 h-3" />}
                {isWaiting && <Clock className="w-3 h-3" />}
                <span className="uppercase tracking-wider">
                    {isServing ? 'Serving' : isCalling ? 'Calling' : 'Waiting'}
                </span>
            </div>
        </div>

        {/* Info & Avatar */}
        <div className="relative z-10 space-y-4 md:space-y-6">
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${isServing ? 'bg-white/10 border-white/10' : 'bg-muted/50 border-border'}`}>
                <div className="relative shrink-0">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex items-center justify-center border ${isServing ? 'bg-black border-white/20' : 'bg-background border-border'}`}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={customerName} className="w-full h-full object-cover" />
                        ) : (
                            <span className={`font-black ${isServing ? 'text-white' : 'text-foreground'}`}>{initial}</span>
                        )}
                    </div>
                </div>
                
                <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">Khách hàng</p>
                    <p className="font-bold text-base md:text-lg leading-tight truncate">{customerName}</p>
                </div>
            </div>

            <div className="space-y-1.5">
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-50">Dịch vụ</p>
                <div className="flex flex-wrap gap-1.5">
                    {services.map((s, i) => (
                        <span key={i} className={`
                            px-2.5 py-1 rounded text-[10px] md:text-xs font-bold border uppercase tracking-wide
                            ${isServing 
                                ? 'bg-white/10 border-white/20 text-white' 
                                : 'bg-secondary text-secondary-foreground border-border'}
                        `}>
                            {SERVICE_NAMES[s] || s}
                        </span>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* --- CUT LINE (Răng cưa) --- */}
      <div className="relative h-6 bg-transparent flex items-center overflow-hidden">
         <div className={`absolute -left-3 w-6 h-6 rounded-full z-20 ${isServing ? 'bg-background' : 'bg-muted'}`}></div>
         <div className={`absolute -right-3 w-6 h-6 rounded-full z-20 ${isServing ? 'bg-background' : 'bg-muted'}`}></div>
         <div className={`w-full h-[1px] mx-4 border-t-2 border-dashed opacity-30 ${isServing ? 'border-white' : 'border-black'}`}></div>
         <div className={`absolute inset-0 z-0 ${isServing ? 'bg-primary' : 'bg-card border-x border-border'}`}></div>
      </div>

      {/* --- BOTTOM SECTION --- */}
      <div className={`
        rounded-b-2xl md:rounded-b-3xl p-5 md:p-6 pt-2 flex flex-col items-center gap-4 md:gap-6
        ${isServing ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground border-x border-b border-border'}
      `}>
        <div className="p-2.5 bg-white rounded-xl shadow-sm">
            <QrCode className="w-24 h-24 md:w-32 md:h-32 text-black" />
        </div>
        
        {!isServing && !isCalling && (
            <button
                onClick={onCancel}
                className="w-full py-3.5 rounded-xl border border-input bg-background hover:bg-accent text-foreground transition-all flex items-center justify-center gap-2 active:scale-95"
            >
                <X className="w-4 h-4" />
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Hủy vé</span>
            </button>
        )}
      </div>
    </div>
  );
}