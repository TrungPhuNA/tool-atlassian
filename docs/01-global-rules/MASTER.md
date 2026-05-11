# MASTER RULES — Toàn bộ quy tắc dự án (AI đọc file này là đủ)

> **Dành cho AI Agent**: File này tổng hợp TẤT CẢ quy tắc cần biết.
> Đọc phần stack nào đang dùng trong dự án, bỏ qua phần còn lại.
> Dự án hiện tại (OmniTest) dùng: **Node.js** + **React.js**

---

## 🌐 Quy tắc chung — Áp dụng cho MỌI STACK

### 1. Ngôn ngữ & Giao tiếp
- Comment code: **Tiếng Việt** — rõ ràng, giải thích mục đích + logic chính + edge case
- Tên biến, hàm, class: **Tiếng Anh** (camelCase hoặc PascalCase tùy ngôn ngữ)
- Không được viết comment chung chung kiểu `// xử lý dữ liệu`

```javascript
// ✅ ĐÚNG: Comment rõ mục đích và logic
// Inject biến môi trường vào URL/Header/Body trước khi gửi request
// VD: {{BASE_URL}} → https://api.example.com
// Edge case: nếu biến không tồn tại, giữ nguyên placeholder {{VAR}}
function injectVariables(template, variables) { ... }

// ❌ SAI: Comment chung chung
// Hàm inject
function injectVariables(template, variables) { ... }
```

### 2. Nguyên tắc làm việc với AI
- AI **chỉ làm đúng yêu cầu**, không tự ý refactor hoặc tối ưu thêm
- Trước khi sửa code liên quan (ngoài phạm vi task), AI phải **hỏi xác nhận**
- Giữ nguyên toàn bộ comment và docstring không liên quan đến task

### 3. Git Flow
```
main        → Production (chỉ merge từ staging sau khi test xong)
staging     → Test/UAT
feature/*   → Tính năng mới (VD: feature/scenario-runner)
fix/*       → Bugfix (VD: fix/env-variable-injection)
hotfix/*    → Fix khẩn cấp trên production
```

**Commit message** (Tiếng Anh):
```
feat: add scenario runner UI
fix: correct variable injection for nested JSON body
docs: update API list with new endpoints
refactor: extract env service to separate module
```

### 4. Database — Bất biến
- **BẮT BUỘC dùng Migration** cho mọi thay đổi schema
- **CẤM** sửa DB trực tiếp qua SQL console trên production
- Mỗi Migration phải có `up()` và `down()` đầy đủ để rollback được
- Tên migration: `YYYYMMDD-verb-description.js` (VD: `20260508-add-docs-column-to-requests.js`)

### 5. Testing & Verification (Bắt buộc)
- **Tư duy**: Mọi thay đổi code đều phải được kiểm chứng thực tế trước khi bàn giao (Done). Không có khái niệm "viết xong rồi chắc là chạy".
- **Kiểm tra API**:
    - Phải chạy server local và test manual bằng `curl`, Postman hoặc giao diện web.
    - Đảm bảo các hàm mới/sửa đổi được `export` đúng cấu trúc để tránh lỗi runtime.
- **Kiểm tra UI**:
    - Kiểm tra trên các trình duyệt phổ biến (Chrome, Safari).
    - Đảm bảo các luồng (flow) cơ bản không bị gãy (broken) sau khi sửa đổi.
- **Tuyệt đối không**: Tuyệt đối không bàn giao code khi chưa chạy thử ít nhất một lần thành công trên môi trường local.

---

## 🟢 NODE.JS RULES

> Stack: Node.js + Express.js + Sequelize (MySQL)
> Dự án áp dụng: **OmniTest Backend** (`/backend`)

### Pattern bắt buộc: Route → Controller → Service → Repository → Model

```
Request → Route (định nghĩa endpoint, gắn middleware)
        → Controller (validate input, gọi service, format response)
        → Service (logic nghiệp vụ, không biết DB trực tiếp)
        → Repository (tương tác DB thuần Sequelize)
        → Model (định nghĩa bảng, không chứa logic)
```

**Ví dụ cụ thể:**
```javascript
// routes/collection.route.js
// Định nghĩa endpoint, gắn middleware validate
router.post('/', validateBody(createCollectionSchema), collectionController.create);

// controllers/collection.controller.js
// Chỉ nhận request, gọi service, trả response — KHÔNG chứa logic DB
async create(req, res, next) {
  try {
    const result = await collectionService.create(req.body);
    res.status(201).json({ status: 'success', data: result });
  } catch (err) {
    next(err); // Đẩy lỗi về global error handler
  }
}

// services/collection.service.js
// Logic nghiệp vụ: validation phức tạp, transform data, gọi repository
async create(data) {
  // Kiểm tra tên trùng
  const existing = await collectionRepository.findByName(data.name);
  if (existing) throw new AppError('Tên collection đã tồn tại', 409);
  return collectionRepository.create(data);
}

// repositories/collection.repository.js
// Tương tác DB thuần Sequelize — không chứa logic nghiệp vụ
async create(data) {
  return Collection.create(data);
}
```

### Async/Await & Error Handling
```javascript
// ✅ Luôn dùng async/await, bọc try-catch
async function myService() {
  try {
    const data = await someAsyncOperation();
    return data;
  } catch (err) {
    // Log lỗi kèm context
    console.error('[myService] Lỗi khi xử lý:', err.message);
    throw err; // Re-throw để controller xử lý
  }
}

// ❌ Không dùng callback hoặc .then().catch() lồng nhau
```

### Response Format chuẩn
```javascript
// Success
res.json({ status: 'success', data: result, message: 'Thành công' });

// Error (qua global error handler)
res.json({ status: 'fail', message: 'Mô tả lỗi cụ thể', code: 'ERROR_CODE' });
```

### Validation
- Dùng **Joi** để validate request body tại lớp middleware
- Schema validate đặt trong `middlewares/validators/` hoặc trong route file
- Không validate thủ công bằng `if (!req.body.name)` trong controller

### Sequelize Model
- Mỗi cột phải có `comment` mô tả ý nghĩa
- Luôn khai báo `tableName` rõ ràng (không để Sequelize tự đặt)
- Dùng Eager Loading (`include`) thay vì query N+1

Chi tiết → [`nodejs.md`](./nodejs.md)

---

## 🔴 PHP LARAVEL RULES

> Stack: PHP 8.x + Laravel 10.x+
> Dự án áp dụng: Các dự án Laravel (copy docs này sang)

### Pattern bắt buộc: Controller → Service → Repository → Model

```
Request → FormRequest (validate)
        → Controller (gọi service, trả response)
        → Service (logic nghiệp vụ)
        → Repository (Eloquent queries)
        → Model (Eloquent model)
```

### Quy tắc cốt lõi
- **Controller**: Chỉ nhận request, gọi service, trả về response — tối đa 30 dòng/method
- **Validation**: Bắt buộc dùng `FormRequest` class, không validate trong controller
- **Eloquent**: Luôn dùng Eager Loading `with()` để tránh N+1 query problem
- **Format**: Tuân thủ PSR-12
- **Response**: Dùng API Resource (`JsonResource`) để format response nhất quán

```php
// ✅ ĐÚNG: Controller gọn, dùng FormRequest và Resource
public function store(CreateProductRequest $request): JsonResponse
{
    $product = $this->productService->create($request->validated());
    return response()->json(new ProductResource($product), 201);
}

// ❌ SAI: Validate trong controller, query thẳng DB
public function store(Request $request): JsonResponse
{
    if (!$request->name) return response()->json(['error' => 'required'], 422);
    $product = Product::create($request->all()); // N+1 risk
    return response()->json($product);
}
```

Chi tiết → [`laravel.md`](./laravel.md)

---

## 🔵 REACT.JS RULES

> Stack: React 18 + Vite + TailwindCSS + Zustand + React Query
> Dự án áp dụng: **OmniTest Frontend** (`/frontend`)

### Cấu trúc Component
- Tối đa **200 dòng** mỗi component — nếu dài hơn thì tách component con
- Mỗi component chỉ có **1 nhiệm vụ** (Single Responsibility)
- Tách logic phức tạp ra **Custom Hook** (`use` prefix)

```jsx
// ✅ ĐÚNG: Component nhỏ gọn, logic tách ra hook
function RequestBuilder() {
  const { request, updateField, sendRequest } = useRequestBuilder(); // Logic ở hook
  return <div>...</div>;
}

// ❌ SAI: Component 300+ dòng, logic và UI trộn lẫn
function RequestBuilder() {
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState('GET');
  // ... 50 dòng state
  const handleSend = async () => {
    // ... 80 dòng logic
  };
  return <div>... 200 dòng JSX ...</div>;
}
```

### State Management
- **Zustand**: Global state (collections, environments, active request)
- **React Query**: Server state (data fetching, caching, sync)
- **useState**: UI-only local state (modal open/close, input values)
- **Không dùng Redux** — quá phức tạp cho tool nội bộ này

### Styling
- **TailwindCSS** — Utility-first, không viết CSS file riêng trừ khi animation phức tạp
- Không dùng inline style (`style={{}}`) trừ giá trị dynamic (width, color từ data)

### UI Components
- Không dùng `alert()`, `confirm()`, `prompt()` của trình duyệt
- Dùng component `Modal` tùy chỉnh cho hộp thoại
- Dùng hệ thống Toast tùy chỉnh cho thông báo

Chi tiết → [`reactjs.md`](./reactjs.md)

---

## 🟣 ANGULAR RULES

> Stack: Angular 17+ + Signals + RxJS + TailwindCSS
> Dự án áp dụng: Các dự án Angular (copy docs này sang)

### Cấu trúc
- **Standalone Components** — Không dùng NgModule (Angular 17+)
- **Signals** thay cho BehaviorSubject khi có thể (simpler, no memory leak)
- **RxJS** cho async streams phức tạp (HTTP, events)
- Tối đa **200 dòng** mỗi component

### Pattern Service
```typescript
// ✅ ĐÚNG: Inject service qua inject() (Angular 14+)
@Component({ ... })
export class ProductListComponent {
  private productService = inject(ProductService);
  products = signal<Product[]>([]);

  ngOnInit() {
    this.productService.getAll().subscribe(data => {
      this.products.set(data);
    });
  }
}
```

### Quy tắc cốt lõi
- Tất cả HTTP call qua **Service** — không gọi HttpClient trực tiếp trong component
- Template chỉ hiển thị — logic phức tạp đưa vào `component.ts` hoặc `service.ts`
- Dùng `OnPush` Change Detection cho performance
- Lazy loading cho mọi feature module

Chi tiết → [`angular.md`](./angular.md)

---

## 🗄️ DATABASE RULES — Áp dụng mọi stack

### Migration
```bash
# Node.js + Sequelize
npx sequelize-cli migration:generate --name add-xxx-to-yyy
npx sequelize-cli db:migrate
npx sequelize-cli db:migrate:undo  # Rollback 1 bước

# Laravel
php artisan make:migration add_xxx_to_yyy_table
php artisan migrate
php artisan migrate:rollback
```

### Đặt tên Migration
```
Node.js:  YYYYMMDD-add-column-to-table.js
Laravel:  YYYY_MM_DD_HHMMSS_add_column_to_table.php
```

### Quy tắc SQL
- Luôn có index cho cột dùng trong `WHERE` và `JOIN`
- Không SELECT * — chỉ lấy cột cần thiết
- Tên bảng: số nhiều, snake_case (`collections`, `test_histories`)
- Tên cột: snake_case (`collection_id`, `created_at`)

Chi tiết → [`git-and-db.md`](./git-and-db.md)

---

## 🎨 UX/UI RULES — Frontend (Bắt buộc với mọi dự án có giao diện)

> Áp dụng cho: OmniTest Frontend (React) và mọi dự án FE khác dùng bộ docs này.

### Nguyên tắc bất biến

| # | Quy tắc | Lý do |
|---|---|---|
| 1 | **Cấm dùng `alert()`, `confirm()`, `prompt()`** | Trải nghiệm tệ, không thể style, chặn luồng |
| 2 | **Dùng component `Modal` tùy chỉnh** cho mọi hộp thoại | Nhất quán, có thể style, không chặn luồng |
| 3 | **Dùng Toast Notification** (Success/Error/Warning) | Feedback không xâm lấn, tự động biến mất |
| 4 | **Animation mượt mà** — dùng CSS transition hoặc Framer Motion | Cảm giác "sống", premium |
| 5 | **Không dùng màu mặc định** — dùng palette thống nhất | Giao diện chuyên nghiệp, không generic |

### Cách dùng đúng

```jsx
// ✅ ĐÚNG: Modal tùy chỉnh
import Modal from '../ui/Modal';
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Xác nhận xóa">
  <p>Bạn có chắc muốn xóa collection <strong>{name}</strong>?</p>
  <div className="flex gap-2 mt-4">
    <button onClick={handleDelete} className="btn-danger">Xóa</button>
    <button onClick={() => setIsOpen(false)} className="btn-secondary">Hủy</button>
  </div>
</Modal>

// ❌ SAI: Dùng browser native dialog
if (window.confirm('Bạn có chắc?')) { handleDelete(); }

// ✅ ĐÚNG: Toast notification
const { showToast } = useToast();
showToast({ type: 'success', message: 'Đã tạo collection thành công!' });
showToast({ type: 'error',   message: 'Kết nối server thất bại. Thử lại sau.' });
showToast({ type: 'warning', message: 'Chưa chọn môi trường, dùng giá trị mặc định.' });

// ❌ SAI: Browser alert
alert('Tạo thành công!');
```

### 5. Design System Standards (Quy chuẩn giao diện)
- **Border Radius (Bo góc)**:
    - **Container lớn/Section**: `rounded-2xl` (16px) hoặc tối đa là `rounded-3xl` (24px). Tránh dùng `rounded-[2.5rem]` vì quá to, làm giao diện mất cân đối.
    - **Button/Input/Card nhỏ**: `rounded-xl` (12px).
    - **Tag/Badge/Avatar**: `rounded-lg` (8px) hoặc `rounded-full`.
- **Button Size (Kích thước nút)**:
    - **Nút chính (Large)**: `px-6 py-3 text-sm`. Tránh dùng `py-4` trừ khi là nút kêu gọi hành động (CTA) cực lớn ở Hero section.
    - **Nút vừa (Medium)**: `px-5 py-2.5 text-sm`. Đây là kích thước tiêu chuẩn cho các form và bảng.
    - **Nút nhỏ (Small)**: `px-3 py-1.5 text-xs`.
- **Typography**:
    - Title: `font-display font-black tracking-tight`.
    - Body: `font-medium text-slate-600`.
- **Spacing**:
    - Khoảng cách giữa các section: `space-y-6` hoặc `space-y-8`.
    - Padding trong card: `p-4` (mobile) và `p-6` hoặc `p-8` (desktop).

---

Chi tiết → [`ui-skeleton.md`](./ui-skeleton.md)

### Checklist UX trước khi submit code

```
□ Không có window.alert/confirm/prompt nào trong code
□ Loading state hiển thị khi đang gọi API (spinner hoặc skeleton)
□ Empty state có UI rõ ràng (không để trang trắng)
□ Error state hiển thị toast hoặc inline message
□ Hover/focus state cho tất cả interactive elements
□ Form có validation feedback rõ ràng (inline error message)
```
