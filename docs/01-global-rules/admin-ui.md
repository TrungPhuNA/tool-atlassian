# Quy tắc thiết kế Admin (Admin UI Rules)

## 1. Ngôn ngữ thiết kế (Design Language)
- **Phong cách**: Flat Design kết hợp Soft Shadows. Ưu tiên sự sạch sẽ, tập trung vào dữ liệu.
- **Màu sắc**: 
  - Chủ đạo (Primary): Indigo-600 (`#4f46e5`) hoặc Violet-600 (`#7c3aed`).
  - Nền (Background): Slate-50 (`#f8fafc`).
  - Card/Panel: Trắng tuyệt đối (`#ffffff`).
- **Typography**: Sử dụng font Sans-serif (Inter/Roboto), cỡ chữ nhỏ gọn (13px - 14px cho dữ liệu bảng).

## 2. Quy tắc Component
- **Input & Form**: 
  - Bo góc `rounded-lg` hoặc `rounded-xl`.
  - Border mỏng `slate-200`, focus sử dụng ring-4 của màu chủ đạo.
- **Gaps**: Giữa Label và Input dùng `space-y-1.5`.

### 5. Image & Media Standards
- **Fallback Mechanism**: 
  - **Bắt buộc**: Mọi thẻ `img` hiển thị nội dung động (từ API) phải có cơ chế fallback.
  - **Placeholder**: Nếu `src` rỗng hoặc null, phải hiện ảnh/icon mặc định của hệ thống.
  - **Error Handling**: Sử dụng thuộc tính `onError` để thay thế `src` bằng ảnh mặc định nếu quá trình tải ảnh thất bại.
  - **UX**: Không được để lộ khung ảnh trống hoặc icon lỗi của trình duyệt.
- **Select**: Tuyệt đối không dùng `select` mặc định của trình duyệt. Bắt buộc dùng `react-select` để có trải nghiệm tốt hơn (search, multi-select).
- **Editor**: Các trường nội dung dài (mô tả truyện, nội dung chương) phải sử dụng Rich Text Editor (React Quill/TipTap).
- **Tables**:
  - Có vạch ngăn cách hàng mỏng.
  - Hover effect cho từng hàng.
  - Phân trang (Pagination) và Bộ lọc (Filters) phải rõ ràng.
- **Badges & Labels**:
  - Tuyệt đối không dùng `uppercase` (in hoa hết). Sử dụng viết hoa chữ cái đầu hoặc viết thường bình thường.
  - Khi có nhiều Badge trạng thái (ví dụ: Trạng thái truyện + Trạng thái hiển thị), phải để trên **cùng một hàng ngang** (`flex-row`), không được để nhảy dòng.

## 3. Layout & Navigation
- **Sidebar**: Dạng cố định bên trái, sử dụng icon của `lucide-react`. Các mục menu phải có trạng thái Active rõ rệt.
- **Header**: Hiển thị Breadcrumbs và thông tin tài khoản admin.
- **Interactions**:
  - Tuyệt đối không dùng `confirm()` mặc định của trình duyệt. 
  - Phải sử dụng `ConfirmModal` của hệ thống để xác nhận các hành động nguy hiểm (Xóa, Ngừng kinh doanh,...).
- **Spacing**: Sử dụng hệ thống padding/margin đồng nhất (p-4, p-6, p-8).
- **Images**: 
  - Luôn phải có ảnh mặc định (Placeholder) nếu dữ liệu trả về trống.
  - Phải xử lý sự kiện `onError` để hiển thị ảnh mặc định nếu link ảnh bị hỏng.
  - Sử dụng component `ImageWithFallback` để đảm bảo tính đồng nhất.
