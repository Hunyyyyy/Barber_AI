// components/queue/ServiceSelector.tsx
import { formatCurrency } from '@/lib/utils';
import { Check } from 'lucide-react'; // Import thêm icon Tag nếu muốn

interface Service {
  id: string;
  name: string;
  price: number;
  discountPrice?: number | null; // [MỚI]
  totalDuration: number; // Đổi tên cho khớp với action getServices trả về
}

interface ServiceSelectorProps {
  services: Service[];
  selected: string[];
  onToggle: (id: string) => void;
}

export default function ServiceSelector({ services, selected, onToggle }: ServiceSelectorProps) {
  return (
    <div className="space-y-3">
      {services.map((service) => {
        const isSelected = selected.includes(service.id);
        
        // Check xem có giảm giá không
        const hasDiscount = service.discountPrice && service.discountPrice < service.price;
        const finalPrice = hasDiscount ? service.discountPrice! : service.price;

        return (
          <div
            key={service.id}
            onClick={() => onToggle(service.id)}
            className={`
              flex justify-between items-center p-4 rounded-xl cursor-pointer border transition-all duration-200 relative overflow-hidden
              ${isSelected 
                ? 'border-black bg-primary text-primary-foreground shadow-md transform scale-[1.02]' 
                : 'border-border bg-card text-foreground hover:border-gray-400'
              }
            `}
          >
            {/* Badge Giảm giá (Optional) */}
            {hasDiscount && !isSelected && (
              <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg">
                SALE
              </div>
            )}

            <div className="flex items-center space-x-3">
              <div className={`
                w-5 h-5 rounded border flex items-center justify-center transition-colors
                ${isSelected ? 'border-white bg-card' : 'border-gray-300'}
              `}>
                {isSelected && <Check className="w-3 h-3 text-foreground" />}
              </div>
              <div>
                <p className="font-medium flex items-center gap-2">
                  {service.name}
                </p>
                <p className={`text-xs ${isSelected ? 'text-gray-300' : 'text-muted-foreground'}`}>
                  ~{service.totalDuration} phút
                </p>
              </div>
            </div>

            <div className="text-right">
                {hasDiscount ? (
                    <div className="flex flex-col items-end">
                        <span className={`text-xs line-through ${isSelected ? 'text-gray-400' : 'text-gray-400'}`}>
                            {formatCurrency(service.price)}
                        </span>
                        <span className={`font-bold ${isSelected ? 'text-white' : 'text-red-500'}`}>
                            {formatCurrency(finalPrice)}
                        </span>
                    </div>
                ) : (
                    <span className="font-medium text-sm">
                        {formatCurrency(service.price)}
                    </span>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
}