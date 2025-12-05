// components/queue/ServiceSelector.tsx
import { formatCurrency } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
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
        return (
          <div
            key={service.id}
            onClick={() => onToggle(service.id)}
            className={`
              flex justify-between items-center p-4 rounded-xl cursor-pointer border transition-all duration-200
              ${isSelected 
                ? 'border-black bg-black text-white shadow-md transform scale-[1.02]' 
                : 'border-gray-200 bg-white text-black hover:border-gray-400'
              }
            `}
          >
            <div className="flex items-center space-x-3">
              <div className={`
                w-5 h-5 rounded border flex items-center justify-center transition-colors
                ${isSelected ? 'border-white bg-white' : 'border-gray-300'}
              `}>
                {isSelected && <Check className="w-3 h-3 text-black" />}
              </div>
              <div>
                <p className="font-medium">{service.name}</p>
                <p className={`text-xs ${isSelected ? 'text-gray-400' : 'text-gray-500'}`}>
                  ~{service.duration} phút
                </p>
              </div>
            </div>
            <span className="font-medium text-sm">
              {formatCurrency(service.price)}
            </span>
          </div>
        );
      })}
    </div>
  );
}