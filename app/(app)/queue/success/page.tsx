// app/queue/success/page.tsx
import SuccessScreen from '@/components/queue/SuccessScreen';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <SuccessScreen />
      </div>
    </div>
  );
}