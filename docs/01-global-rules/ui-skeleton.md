# Quy tắc về Giao diện & Skeleton

## 1. Đồng bộ Skeleton và Layout
- **Bắt buộc**: Skeleton (`loading.jsx`) phải khớp 100% về bố cục (layout), khoảng cách (padding/margin) và kích thước với giao diện thực tế sau khi render.
- **Mục đích**: Tránh hiện tượng Layout Shift (nhảy khung hình) gây khó chịu cho người dùng.
- **Thiết kế**: Sử dụng các khối `Skeleton` của hệ thống (`slate-100/200`) thay vì các hiệu ứng màu sắc khác.

## 2. Xử lý ảnh mặc định (Default Image)
- **Bắt buộc**: Không sử dụng emoji làm ảnh mặc định cho truyện hoặc tác giả.
- **Thiết kế**: Sử dụng một khung hình màu xám trung tính (`bg-slate-100`) có kích thước full-size so với container.
- **Hiển thị**: Đảm bảo ảnh mặc định lấp đầy toàn bộ khung hình (`object-cover`) để tránh bị vỡ layout.

## 3. Typography & Tỉ lệ
- **Nguyên tắc**: Ưu tiên sự tinh gọn. Tiêu đề không được quá to gây lấn át nội dung hoặc xuống hàng đột ngột trên các thiết bị.
- **Accent Color**: Luôn sử dụng màu Đỏ-Cam (`#cf5d49`) cho các thành phần quan trọng để tạo điểm nhấn thương hiệu.
