# Node.js Coding Rules — Chi tiết

> Tóm tắt nhanh → xem [`MASTER.md`](./MASTER.md) phần Node.js.

---

## Môi trường & Version

| Thứ | Phiên bản |
|---|---|
| Node.js | v16+ (LTS) |
| Framework | Express.js 4.x |
| ORM | Sequelize 6.x |
| Database | MySQL 8.x |
| Validation | Joi |

---

## Pattern bắt buộc: Route → Controller → Service → Repository → Model

```
Route:       Định nghĩa endpoint, gắn middleware validate
Controller:  Nhận req, gọi service, trả res — KHÔNG chứa logic
Service:     Logic nghiệp vụ — KHÔNG biết req/res
Repository:  Tương tác DB qua Sequelize — KHÔNG chứa business logic
Model:       Định nghĩa bảng, KHÔNG chứa logic
```

---

## Controller — Ví dụ chuẩn

```javascript
// controllers/collection.controller.js
// Nhiệm vụ: Nhận request → Gọi service → Trả response
// KHÔNG chứa logic nghiệp vụ hay query DB trực tiếp

const collectionService = require('../services/collection.service');

const create = async (req, res, next) => {
  try {
    // Body đã được validate bởi middleware trước
    const result = await collectionService.create(req.body);
    res.status(201).json({ status: 'success', data: result });
  } catch (err) {
    next(err); // Đẩy về global error handler
  }
};

module.exports = { create };
```

---

## Service — Ví dụ chuẩn

```javascript
// services/collection.service.js
// Nhiệm vụ: Logic nghiệp vụ. Không dùng req/res.

const collectionRepository = require('../repositories/collection.repository');
const { AppError } = require('../middlewares/errorHandler.middleware');

const create = async (data) => {
  // Kiểm tra tên trùng — business logic đặt ở đây
  const existing = await collectionRepository.findByName(data.name);
  if (existing) throw new AppError('Tên collection đã tồn tại', 409);
  return collectionRepository.create(data);
};

module.exports = { create };
```

---

## Repository — Ví dụ chuẩn

```javascript
// repositories/collection.repository.js
// Nhiệm vụ: Tương tác DB thuần Sequelize

const { Collection } = require('../models');

const findByName = async (name) => {
  return Collection.findOne({ where: { name } });
};

const create = async (data) => {
  return Collection.create(data);
};

module.exports = { findByName, create };
```

---

## Model — Quy tắc

```javascript
// models/Collection.js
// Mỗi cột PHẢI có comment mô tả ý nghĩa
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Collection', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Tên collection — unique trong toàn hệ thống',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mô tả mục đích collection, hỗ trợ Markdown',
    },
  }, {
    tableName: 'collections', // Bắt buộc khai báo rõ
    underscored: true,
  });
};
```

---

## Error Handling

```javascript
// Dùng AppError cho lỗi có chủ đích (4xx)
throw new AppError('Không tìm thấy collection', 404);
throw new AppError('Tên đã tồn tại', 409);

// Lỗi không có statusCode → global handler tự trả 500
throw new Error('Kết nối DB thất bại');
```

---

## Validation với Joi

```javascript
// Đặt schema trong route hoặc validators/
const schema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  method: Joi.string().valid('GET','POST','PUT','PATCH','DELETE').required(),
  url: Joi.string().required(),
});

// Middleware tái sử dụng
const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({ status: 'fail', errors: error.details.map(d => d.message) });
  }
  req.body = value;
  next();
};
```

---

## Lưu ý quan trọng

1. **N+1 Query**: Luôn dùng `include` (Eager Loading), không query trong vòng lặp
2. **JSON fields**: Sequelize tự serialize — đọc ra là JS object
3. **Async**: Luôn dùng `async/await`, bọc trong `try/catch`, re-throw lỗi lên controller
4. **Socket.io**: Không emit từ service — truyền `io` qua tham số hoặc singleton
5. **Upload & Media**: 
   - Sử dụng `multer` để xử lý upload.
   - Mỗi loại file (avatar, cover, docs) nên có thư mục lưu trữ riêng trong `uploads/`.
   - **Bắt buộc**: API trả về link ảnh phải là **link tuyệt đối** (đầy đủ `http://...`). Sử dụng biến môi trường `APP_URL`.
   - Luôn kiểm tra `mimetype` và giới hạn dung lượng file (`fileSize`).
   - Tên file lưu trữ nên bao gồm timestamp (`Date.now()`) để tránh trùng lặp.

### 11. Testing & Verification (Bắt buộc)
- **Kiểm tra API**: Mọi API mới hoặc được chỉnh sửa phải được kiểm tra thực tế (Test Manual) trước khi báo cáo hoàn thành.
- **Cách thức**:
    - Chạy server local (`npm run start/dev`) và đảm bảo không có lỗi khởi động.
    - Sử dụng `curl`, Postman hoặc script test để xác nhận API trả về đúng cấu trúc dữ liệu mong muốn.
    - Kiểm tra kỹ việc xuất khẩu (export) các hàm trong Controller/Service để tránh lỗi `is not a function`.
- **Tuyệt đối không**: Không được bàn giao code khi chỉ mới viết xong mà chưa chạy thử ít nhất một lần trên môi trường local.

---

*Lưu ý: Luôn tuân thủ các nguyên tắc trên để đảm bảo codebase sạch, dễ bảo trì và hiệu suất cao.*
