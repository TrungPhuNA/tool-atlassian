# Git Flow & Database Rules

> Tóm tắt nhanh → xem [`MASTER.md`](./MASTER.md) phần Git & DB.

---

## Git Flow

### Mô hình nhánh

```
main        → Production (bảo vệ, chỉ merge từ staging sau review)
staging     → Test/UAT (merge từ feature khi dev xong)
feature/*   → Tính năng mới
fix/*       → Bugfix thường
hotfix/*    → Fix khẩn cấp trên production
```

### Quy tắc đặt tên nhánh

```bash
# Tính năng mới
feature/scenario-runner
feature/parallel-api-runner
feature/data-driven-testing

# Sửa lỗi
fix/env-variable-not-injected
fix/k6-socket-disconnect

# Hotfix khẩn
hotfix/proxy-timeout-production
```

### Quy tắc Commit Message (Tiếng Anh)

Format: `<type>: <mô tả ngắn gọn, viết thường>`

| Type | Khi nào dùng |
|---|---|
| `feat` | Thêm tính năng mới |
| `fix` | Sửa lỗi |
| `docs` | Thêm/sửa tài liệu |
| `refactor` | Tái cấu trúc code (không thêm tính năng, không sửa lỗi) |
| `style` | Thay đổi UI/CSS (không ảnh hưởng logic) |
| `test` | Thêm/sửa test |
| `chore` | Config, cập nhật dependency, tooling |
| `perf` | Tối ưu hiệu năng |

```bash
# ✅ Đúng
feat: add pre-request script execution in sandbox
fix: correct variable injection for nested json body
docs: update api list with scenario endpoints
refactor: extract env service from proxy service
chore: upgrade sequelize to v6.35

# ❌ Sai
update code
fix bug
WIP
```

### Quy trình làm việc

```bash
# 1. Tạo nhánh mới từ staging
git checkout staging
git pull origin staging
git checkout -b feature/ten-tinh-nang

# 2. Code, commit thường xuyên
git add .
git commit -m "feat: add basic scenario model"

# 3. Push và tạo PR về staging
git push origin feature/ten-tinh-nang
# → Tạo Pull Request: feature/ten-tinh-nang → staging

# 4. Sau khi test xong trên staging → merge vào main
# → Tạo Pull Request: staging → main
```

---

## Database Rules

### Nguyên tắc tối thượng

> [!CAUTION]
> **CẤM sửa database trực tiếp trên production** qua SQL console.
> Mọi thay đổi schema PHẢI đi qua Migration.

### Migration — Node.js (Sequelize)

```bash
# Tạo migration mới
npx sequelize-cli migration:generate --name add-docs-column-to-requests

# Chạy migration
npx sequelize-cli db:migrate

# Rollback 1 bước
npx sequelize-cli db:migrate:undo

# Rollback đến migration cụ thể
npx sequelize-cli db:migrate:undo:all --to XXXXXXXXXXXXXX-create-requests.js
```

**Cấu trúc migration chuẩn:**

```javascript
// migrations/20260508000000-add-docs-column-to-requests.js
'use strict';

module.exports = {
  // up: Thay đổi schema (chạy khi migrate)
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('requests', 'docs', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Ghi chú / tài liệu mô tả request này, hỗ trợ Markdown',
      // Đặt sau cột nào (MySQL-specific)
      after: 'assertions',
    });
  },

  // down: Hoàn tác (chạy khi rollback) — PHẢI có, không được bỏ
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('requests', 'docs');
  },
};
```

### Migration — Laravel

```bash
# Tạo migration
php artisan make:migration add_docs_column_to_requests_table

# Chạy migration
php artisan migrate

# Rollback
php artisan migrate:rollback
php artisan migrate:rollback --step=3  # Rollback 3 bước
```

### Đặt tên Migration

```
Node.js:  YYYYMMDDHHMMSS-verb-description.js
          VD: 20260508093000-add-docs-column-to-requests.js

Laravel:  YYYY_MM_DD_HHMMSS_verb_description.php
          VD: 2026_05_08_093000_add_docs_column_to_requests_table.php
```

**Động từ thường dùng:**
- `create` — Tạo bảng mới
- `add` — Thêm cột
- `remove` — Xóa cột
- `rename` — Đổi tên cột/bảng
- `alter` — Thay đổi kiểu dữ liệu
- `add-index` — Thêm index

### Quy tắc SQL chung

| Quy tắc | Lý do |
|---|---|
| Không `SELECT *` — chỉ lấy cột cần thiết | Performance, tránh expose sensitive data |
| Index cho cột dùng trong `WHERE`/`JOIN` | Query nhanh hơn |
| Tên bảng: số nhiều, snake_case | Nhất quán: `collections`, `test_histories` |
| Tên cột: snake_case | Nhất quán: `collection_id`, `created_at` |
| Foreign key: `[table_singular]_id` | Rõ ràng: `collection_id`, `user_id` |
| Soft delete > Hard delete | Bảo toàn dữ liệu, có thể phục hồi |

### Seed Data (Dev only)

```bash
# Node.js Sequelize
npx sequelize-cli db:seed:all           # Chạy tất cả seeders
npx sequelize-cli db:seed:undo:all      # Xóa tất cả seed data

# Laravel
php artisan db:seed
php artisan db:seed --class=ProductSeeder
```

> **Lưu ý**: Seed data chỉ chạy trên môi trường `development`.
> Không bao giờ chạy seed trên production.
