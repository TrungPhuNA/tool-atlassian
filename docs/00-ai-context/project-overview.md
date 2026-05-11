# Tổng quan dự án: Jira Reporting Tool

> **Dành cho AI Agent**: Đọc file này để hiểu bức tranh tổng thể của dự án Jira Tool.

---

## 🎯 Dự án là gì?

**Jira Reporting Tool** là công cụ nội bộ dùng để theo dõi tiến độ công việc, quản lý task và lập báo cáo hàng tuần dựa trên dữ liệu từ Jira Cloud.

**Mục tiêu**:
- Tự động hóa việc lấy dữ liệu từ Jira (Stories, Tasks, Bugs, Sub-tasks).
- Theo dõi log time và tiến độ công việc của nhân sự.
- Cảnh báo các task thiếu thông tin quan trọng (start/end date).
- Tổng hợp báo cáo tuần nhanh chóng.

---

## 🛠️ Tech Stack

### Backend API (`/api`)
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Sequelize (MySQL 8)
- **Pattern**: Route → Controller → Service → Repository

### Frontend (`/frontend`)
- **Framework**: React.js (Vite)
- **Styling**: TailwindCSS
- **State**: Zustand + React Query

---

## 📁 Cấu trúc Phases (docs/04-features)

Dự án được chia thành các phase chính:
1. **Phase 1**: Khởi tạo Database & Kết nối Jira Sync.
2. **Phase 2**: Xây dựng Sync Engine (Đồng bộ task & sub-task).
3. **Phase 3**: Hệ thống Báo cáo & Cảnh báo (Alert Job).
4. **Phase 4**: Dashboard UI & Visualization.
