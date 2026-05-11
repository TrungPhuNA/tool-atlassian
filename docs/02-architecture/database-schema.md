# Database Schema — Jira Reporting Tool

## 1. jira_configs
Lưu trữ thông tin cấu hình kết nối tới Jira.

| Field | Type | Description |
|---|---|---|
| id | INT | Primary Key |
| jira_domain | VARCHAR | VD: company.atlassian.net |
| jira_email | VARCHAR | Email dùng để auth |
| api_token | TEXT | API Token (Mã hóa) |
| created_at | DATETIME | |
| updated_at | DATETIME | |

---

## 2. jira_issues
Lưu trữ thông tin các task lấy từ Jira.

| Field | Type | Description |
|---|---|---|
| id | INT | Primary Key |
| issue_key | VARCHAR | VD: PROJ-123 (Unique) |
| issue_type | VARCHAR | Story, Task, Bug, Sub-task... |
| parent_id | INT | ID của issue cha (cho sub-tasks) |
| summary | TEXT | Tiêu đề task |
| status | VARCHAR | Trạng thái Jira |
| assignee_id | VARCHAR | ID nhân sự được assign |
| start_date | DATE | Ngày bắt đầu |
| end_date | DATE | Hạn hoàn thành |
| priority | VARCHAR | Mức độ ưu tiên |
| jira_data | JSON | Lưu toàn bộ payload gốc từ Jira (Backup) |
| last_sync_at | DATETIME | Lần cuối đồng bộ |

---

## 3. employees
Danh sách nhân sự nội bộ cần theo dõi.

| Field | Type | Description |
|---|---|---|
| id | INT | Primary Key |
| display_name | VARCHAR | Tên hiển thị |
| jira_account_id | VARCHAR | ID người dùng trên Jira |
| email | VARCHAR | Email công việc |
| active | BOOLEAN | Trạng thái hoạt động |
