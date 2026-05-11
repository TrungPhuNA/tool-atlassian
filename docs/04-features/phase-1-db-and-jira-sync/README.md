# Phase 1: Database & Jira Integration

## Mục tiêu
Thiết lập nền tảng dữ liệu và kết nối thành công với Jira Cloud API.

## Các công việc cụ thể
1. **Thiết kế Database Schema**:
   - Bảng `jira_configs`: Lưu Domain, Email, API Token.
   - Bảng `jira_issues`: Lưu thông tin cơ bản của task.
   - Bảng `employees`: Map Jira User với nhân sự nội bộ.
2. **Khởi tạo Migration**:
   - Tạo các file migration tương ứng bằng Sequelize.
3. **Xây dựng Jira Service**:
   - Implement hàm `testConnection`.
   - Implement hàm `fetchBasicIssue` (lấy thử 1 issue theo key).

## Tài liệu liên quan
- [Database Schema](../../02-architecture/database-schema.md)
