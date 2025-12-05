// app/lib/googleImageSearch.ts
const GOOGLE_CSE_API_KEY = process.env.GOOGLE_CSE_API_KEY!;
const GOOGLE_CSE_CX = process.env.GOOGLE_CSE_CX!;

export async function searchHairstyleImage(
  hairstyleName: string,
  isMale: boolean = true,
  count: number = 5 // Thêm tham số yêu cầu số lượng ảnh
): Promise<string[] | null> { // <-- THAY ĐỔI: Trả về mảng string
  const gender = isMale ? "men" : "women";
  const query = `${hairstyleName} ${gender} hairstyle high quality 2025`;

  const url = `https://www.googleapis.com/customsearch/v1`;

  try {
    const res = await fetch(
      `${url}?key=${GOOGLE_CSE_API_KEY}&cx=${GOOGLE_CSE_CX}&q=${encodeURIComponent(
        query
      )}&searchType=image&num=10&imgSize=large&fileType=jpg,png`
    );

    if (!res.ok) {
      const error = await res.text();
      console.error("Google CSE Error:", error);
      return null;
    }

    const data = await res.json();

    if (!data.items?.length) return null;

    // Lọc: Ưu tiên ảnh lớn, đẹp, từ nguồn uy tín và lấy 5 ảnh đầu tiên
    const uniqueImages = data.items
      .filter(
        (item: any) =>
          item.link &&
          item.image?.width >= 300 && // Giảm điều kiện kích thước để đảm bảo có đủ ảnh
          !item.link.includes("gstatic.com")
      )
      .map((item: any) => item.link)
      .slice(0, count); // <-- CHỈ LẤY ĐÚNG SỐ LƯỢNG YÊU CẦU

    if (uniqueImages.length < count) {
        // Tái sử dụng các ảnh đã có để đủ 5 slot cho carousel, tránh lỗi
        const result: string[] = [];
        while(result.length < count && uniqueImages.length > 0) {
            result.push(...uniqueImages);
        }
        return result.slice(0, count);
    }

    return uniqueImages;
  } catch (err) {
    console.error("searchHairstyleImage error:", err);
    return null;
  }
}