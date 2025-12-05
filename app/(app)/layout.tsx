// test-barber\app\(app)\suggest\layout.tsx
import Footer from "@/components/layout/Footer";
import LeftSideBar from "@/components/layout/LeftSideBar";
import ServerHeader from "@/components/layout/ServerHeader";
import NextTopLoader from 'nextjs-toploader'; // 1. Đã import

export const metadata = {
  title: "Suggest Hairstyles - Barber App",
  description: "Get personalized hairstyle suggestions based on your facial features.",
};

export default function SuggestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      {/* 2. Cần đặt Component vào đây (thường đặt đầu tiên) */}
      <NextTopLoader 
        color="#000000"
        showSpinner={false}
      />

      <ServerHeader />
      
      <div className="flex flex-1">
        <LeftSideBar />
        
        {/* Main content với hiệu ứng glassmorphism */}
        <main className="flex-1 transition-all duration-300 ease-in-out p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 md:p-8 min-h-[calc(100vh-200px)]">
              {children}
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
}