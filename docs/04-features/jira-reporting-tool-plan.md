# Kế hoạch chi tiết: Jira Reporting Tool (Full Plan)

## 1. Kiến trúc Tổng thể
Hệ thống bao gồm 2 phần chính:
- **Backend (api)**: Node.js/Express phục vụ API đồng bộ, lưu trữ và xử lý logic báo cáo.
- **Frontend (frontend)**: React.js/Vite cung cấp giao diện quản trị, xem task và dashboard.

---

## 2. Các giai đoạn triển khai (Phases)

### Phase 1: Cấu hình & Kết nối (Infrastructure)
- **Backend**:
    - [x] Khởi tạo dự án, Migration & Models.
    - [ ] API CRUD `jira_configs`: Quản lý thông tin kết nối.
    - [ ] API `test-connection`: Kiểm tra tính hợp lệ của Jira Token.
- **Frontend**:
    - [ ] Khởi tạo dự án React (Vite).
    - [ ] Trang **Jira Settings**: Cho phép user nhập và lưu cấu hình Jira.
    - [ ] Tích hợp thông báo (Toast) khi test kết nối thành công/thất bại.

### Phase 2: Đồng bộ & Quản lý Task (Sync Engine)
- **Backend**:
    - [ ] API `sync-issues`: Đồng bộ task từ Jira về MySQL.
    - [ ] Xử lý đệ quy để lấy toàn bộ Sub-tasks.
    - [ ] API `get-issues`: Lấy danh sách task hỗ trợ phân trang, lọc theo type/status/assignee.
- **Frontend**:
    - [ ] Trang **Task Management**: Hiển thị danh sách task dưới dạng bảng (Table) hoặc cây (Tree view).
    - [ ] Tính năng đồng bộ thủ công bằng nút bấm.
    - [ ] Hiển thị chi tiết Task và quan hệ Cha-Con.

### Phase 3: Báo cáo & Cảnh báo (Reporting & Alerts)
- **Backend**:
    - [ ] API `weekly-report`: Tổng hợp công việc theo nhân sự trong tuần.
    - [ ] **Alert Job**: Chạy ngầm định kỳ quét các task thiếu `start_date`, `end_date` và bắn cảnh báo.
    - [ ] API `get-alerts`: Lấy danh sách cảnh báo hiện tại.
- **Frontend**:
    - [ ] Trang **Weekly Reports**: Xem và xuất báo cáo công việc tuần.
    - [ ] Khu vực **Notification/Alerts**: Hiển thị danh sách task cần bổ sung thông tin.

### Phase 4: Dashboard & Tối ưu (Advanced UI)
- **Frontend**:
    - [ ] Biểu đồ trực quan (Charts) về năng suất nhân sự.
    - [ ] Dashboard tổng quan (Stats) về số lượng Bug/Story hoàn thành.

---

## 3. Cấu trúc Dữ liệu (MySQL)
- `jira_configs`: Domain, Email, Token.
- `jira_issues`: Tasks, Sub-tasks, Dates, Types.
- `employees`: Jira Account Mapping.
- `weekly_reports`: Báo cáo đã chốt.

---

## 4. Quy tắc thực hiện
- Tuân thủ tuyệt đối chuẩn **Route → Controller → Service → Repository**.
- Frontend tách biệt logic ra **Hooks**, UI dùng **TailwindCSS** premium.
- Comment Tiếng Việt đầy đủ.
