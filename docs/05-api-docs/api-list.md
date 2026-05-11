# Jira Reporting Tool - API Documentation

Hệ thống sử dụng cơ chế **JWT Authentication** để bảo mật các endpoint.

## 1. Authentication
| Method | Endpoint | Description | Role |
| :--- | :--- | :--- | :--- |
| POST | `/api/v1/auth/login` | Đăng nhập hệ thống | Guest |
| POST | `/api/v1/auth/register` | Đăng ký (Dành cho khởi tạo/admin) | Admin |
| GET | `/api/v1/auth/me` | Lấy thông tin user hiện tại | User/Admin |

## 2. User Management (Admin Only)
| Method | Endpoint | Description | Role |
| :--- | :--- | :--- | :--- |
| GET | `/api/v1/admin/users` | Danh sách người dùng | Admin |
| POST | `/api/v1/admin/users` | Tạo người dùng mới | Admin |
| PUT | `/api/v1/admin/users/:id` | Cập nhật thông tin/role | Admin |
| DELETE | `/api/v1/admin/users/:id` | Xóa người dùng | Admin |

## 3. Jira Configuration (Admin Only)
| Method | Endpoint | Description | Role |
| :--- | :--- | :--- | :--- |
| GET | `/api/v1/admin/jira/config` | Lấy cấu hình Jira hiện tại | Admin |
| POST | `/api/v1/admin/jira/config` | Lưu/Cập nhật cấu hình | Admin |
| POST | `/api/v1/admin/jira/test-connection` | Thử kết nối tới Jira | Admin |

## 4. Sync Jobs (Admin Only)
| Method | Endpoint | Description | Role |
| :--- | :--- | :--- | :--- |
| POST | `/api/v1/admin/jira/sync` | Kích hoạt đồng bộ ngầm | Admin |
| GET | `/api/v1/admin/jira/sync-status` | Kiểm tra tiến độ job gần nhất | Admin |

## 5. Tasks & Reports
| Method | Endpoint | Description | Role |
| :--- | :--- | :--- | :--- |
| GET | `/api/v1/tasks` | Lấy danh sách task (có filter/search) | User/Admin |
| GET | `/api/v1/tasks/:id` | Chi tiết task | User/Admin |
| GET | `/api/v1/reports/summary` | Lấy dữ liệu tổng quan cho biểu đồ | User/Admin |

---
**Chú ý**: Tất cả các request yêu cầu Role đều phải đính kèm Header:
`Authorization: Bearer <your_jwt_token>`
