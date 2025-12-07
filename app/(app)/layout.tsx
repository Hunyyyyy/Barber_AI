import { getCurrentUserRoleAction } from "@/actions/user.actions"; // Đảm bảo đường dẫn đúng
import Footer from "@/components/layout/Footer";
import LeftSideBar from "@/components/layout/LeftSideBar";
import ServerHeader from "@/components/layout/ServerHeader";
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from "sonner";

export const metadata = {
  title: "Suggest Hairstyles - Barber App",
  description: "Get personalized hairstyle suggestions based on your facial features.",
};

export default async function SuggestLayout({ children }: { children: React.ReactNode }) {
  const role = await getCurrentUserRoleAction();
  return (
    <div className="h-screen flex flex-col bg-background text-foreground font-sans overflow-hidden">
      <Toaster richColors position="top-center" />
      <NextTopLoader 
        color="currentColor"
        showSpinner={false}
      />

      {/* 1. Header: Cố định tuyệt đối ở trên cùng, z-index cao nhất */}
      <div className="fixed top-0 inset-x-0 z-[60] h-16 md:h-20 bg-background/80 backdrop-blur-md border-b border-border">
          <ServerHeader />
      </div>
      
      {/* 2. Layout Body: Bắt đầu ngay dưới Header */}
      <div className="flex flex-1 pt-16 md:pt-20 h-full w-full">
        
        {/* 3. Sidebar Container:
            - hidden md:block: Chỉ hiện trên desktop
            - w-fit: Co dãn theo độ rộng của LeftSideBar con (w-20 hoặc w-64)
            - shrink-0: Không bị ép nhỏ lại
            - z-50: Nằm trên nội dung chính nhưng dưới header (nếu header đè lên)
            - QUAN TRỌNG: Không dùng overflow-hidden/auto ở đây để Tooltip (absolute) có thể hiển thị ra ngoài
        */}
        <aside className="hidden md:block w-fit shrink-0 h-full z-50 relative">
            <LeftSideBar role={role} />
        </aside>
        
        {/* 4. Main Content:
            - flex-1: Chiếm hết phần còn lại
            - overflow-y-auto: Chỉ vùng này cuộn, Header và Sidebar đứng yên
            - scroll-smooth: Cuộn mượt
        */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto bg-muted/10 relative scroll-smooth">
          <div className="flex flex-col min-h-full w-full">
            {/* Nội dung trang: Full width, không padding thừa */}
            <div className="flex-1 w-full p-0">
              {children}
            </div>

            {/* Footer nằm cuối vùng cuộn */}
            <div className="mt-auto border-t border-border">
                <Footer />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}