//E:\NextJs\test-barber\app\api\gemini\analyze\route.tsx
import { analyzeFaceAndSuggestHairstyles } from "@/lib/gemini";
export async function POST(request: Request) {
    const { imageBase64 } = await request.json();
    const analysisResult = await analyzeFaceAndSuggestHairstyles(imageBase64);
    return new Response(JSON.stringify(analysisResult), {
      headers: { "Content-Type": "application/json" },
    });
  }