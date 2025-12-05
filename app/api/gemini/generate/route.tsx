// //E:\NextJs\test-barber\app\api\gemini\generate\route.tsx
// import { editImage } from "@/lib/gemini";
// export async function POST(request: Request) {
//     try {
//         const { imageBase64, prompt } = await request.json();
//         if (!imageBase64 || !prompt) {
//             return new Response(JSON.stringify({ error: "Missing imageBase64 or prompt in request body." }), {
//                 status: 400,
//                 headers: { 'Content-Type': 'application/json',
//                     Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`
//                  },
//             });
//         }
//         const editedImage = await editImage(imageBase64, prompt);
//         return new Response(JSON.stringify({ editedImage }), {
//             status: 200,
//             headers: { 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`
//              },
//         });
//     }
//     catch (error) {
//         console.error("Error in /api/gemini/generate route:", error);
//         return new Response(JSON.stringify({ error: (error as Error).message || "Internal Server Error" }), {
//             status: 500,
//             headers: { 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}` },
//         });
//     }
// }
// E:\NextJs\test-barber\app\api\gemini\generate\route.tsx

import { editImage, mockEditImage } from "@/lib/gemini"; // Đã thêm mockEditImage

// Thay đổi hằng số này để bật/tắt chế độ mock
const USE_MOCK_IMAGE = true; 

export async function POST(request: Request) {
    try {
        const { imageBase64, prompt } = await request.json();
        if (!imageBase64 || !prompt) {
            return new Response(JSON.stringify({ error: "Missing imageBase64 or prompt in request body." }), {
                status: 400,
                headers: { 'Content-Type': 'application/json',
                    Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`
                 },
            });
        }
        
        let editedImage;
        if (USE_MOCK_IMAGE) {
            // SỬ DỤNG HÀM MOCK ĐỂ TRÁNH GỌI GEMINI
            console.log("MOCK MODE: Using mockEditImage.");
            editedImage = await mockEditImage(imageBase64, prompt); 
        } else {
            // SỬ DỤNG HÀM THẬT
            editedImage = await editImage(imageBase64, prompt); 
        }

        return new Response(JSON.stringify({ editedImage }), {
            status: 200,
            headers: { 'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}`
             },
        });
    }
    catch (error) {
        console.error("Error in /api/gemini/generate route:", error);
        return new Response(JSON.stringify({ error: (error as Error).message || "Internal Server Error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.INTERNAL_API_SECRET}` },
        });
    }
}