# React.js Coding Rules — Chi tiết

> Tóm tắt nhanh → xem [`MASTER.md`](./MASTER.md) phần React.js.

---

## Môi trường & Version

| Thứ | Phiên bản |
|---|---|
| React | 18.x |
| Build tool | Vite 5.x |
| Styling | TailwindCSS 3.x |
| State (Global) | Zustand 4.x |
| State (Server) | React Query (TanStack Query) |
| HTTP | Axios |
| Icons | Lucide React |

---

## Cấu trúc thư mục Frontend

```
frontend/src/
├── components/       # UI components tái sử dụng
│   ├── ui/           # Atomic: Button, Input, Modal, Toast
│   ├── layout/       # Layout: Sidebar, Header
│   └── features/     # Feature-specific: RequestBuilder, CollectionTree
├── pages/            # Trang đầy đủ (kết hợp nhiều components)
├── hooks/            # Custom hooks (tên bắt đầu bằng `use`)
├── store/            # Zustand stores
├── utils/            # Helper functions thuần (không có React code)
└── assets/           # Hình ảnh, fonts
```

---

## Component — Quy tắc

```jsx
// components/features/RequestBuilder/MethodSelector.jsx
// Mục đích: Dropdown chọn HTTP method (GET/POST/PUT/PATCH/DELETE)
// Logic: Đổi màu theo method, emit onChange lên parent

import { useRequestStore } from '../../../store/request.store';

// Màu badge cho từng HTTP method
const METHOD_COLORS = {
  GET:    'text-green-400',
  POST:   'text-blue-400',
  PUT:    'text-yellow-400',
  PATCH:  'text-orange-400',
  DELETE: 'text-red-400',
};

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

// Component chọn method — nhận value và onChange từ parent
function MethodSelector({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`font-mono font-bold text-sm px-3 py-2 rounded bg-gray-800 border border-gray-700 ${METHOD_COLORS[value]}`}
    >
      {METHODS.map((m) => (
        <option key={m} value={m}>{m}</option>
      ))}
    </select>
  );
}

export default MethodSelector;
```

**Quy tắc Component:**
- Tối đa **200 dòng** — nếu vượt, tách component con
- 1 file = 1 component chính (có thể có sub-components nhỏ cùng file)
- Không mix logic phức tạp với JSX — tách ra custom hook
- File name: **PascalCase** (`MethodSelector.jsx`)

---

## Custom Hook — Quy tắc

### 3. Thông báo và Tương tác (UX)
- **TUYỆT ĐỐI KHÔNG** sử dụng `alert()` hoặc `confirm()` mặc định của trình duyệt. 
- Sử dụng các giải pháp thông báo hiện đại như **Toast** (thông báo nhanh), **Modal** hoặc **ConfirmModal** (xác nhận quan trọng).
- Mọi thông báo lỗi hoặc thành công từ API phải được hiển thị qua UI đẹp mắt, đồng bộ với thiết kế của website.
- **BẮT BUỘC**: Thông báo lỗi phải thân thiện với người dùng (User-friendly). Không được hiển thị các mã lỗi kỹ thuật (ví dụ: "Validation error", "SequelizeUniqueConstraintError"). Nếu API trả về lỗi chung chung, Frontend phải có logic để "dịch" sang tiếng Việt dễ hiểu (ví dụ: "Số chương đã tồn tại" thay vì "not unique").
- Các hành động yêu cầu đăng nhập phải chuyển hướng người dùng đến trang đăng nhập hoặc hiển thị Modal đăng nhập thay vì dùng `alert()`.

```javascript
// hooks/useRequestBuilder.js
// Mục đích: Quản lý toàn bộ state và logic của Request Builder
// Tách ra khỏi component để test và tái sử dụng dễ hơn

import { useState, useCallback } from 'react';
import { useRequestStore } from '../store/request.store';
import { proxyApi } from '../utils/api';

export function useRequestBuilder() {
  const { activeRequest, updateActiveRequest } = useRequestStore();
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);

  // Cập nhật một field trong request (tối ưu, không re-render toàn bộ)
  const updateField = useCallback((field, value) => {
    updateActiveRequest({ [field]: value });
  }, [updateActiveRequest]);

  // Gửi request qua backend proxy
  const sendRequest = useCallback(async () => {
    if (!activeRequest.url) return;
    setIsLoading(true);
    try {
      const result = await proxyApi.execute(activeRequest);
      setResponse(result);
    } catch (err) {
      console.error('[useRequestBuilder] Lỗi gửi request:', err);
      setResponse({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [activeRequest]);

  return { activeRequest, response, isLoading, updateField, sendRequest };
}
```

---

## Zustand Store — Quy tắc

```javascript
// store/collection.store.js
// Mục đích: Quản lý state Collections, Folders, và Requests trong sidebar
// Đây là global state — chỉ đặt những gì cần dùng ở nhiều nơi

import { create } from 'zustand';
import { collectionApi } from '../utils/api';

export const useCollectionStore = create((set, get) => ({
  // State
  collections: [],
  isLoading: false,

  // Action: Tải danh sách collections từ API
  fetchCollections: async () => {
    set({ isLoading: true });
    try {
      const data = await collectionApi.getAll();
      set({ collections: data });
    } catch (err) {
      console.error('[collectionStore] Lỗi tải collections:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  // Action: Thêm collection mới vào state local (sau khi API tạo thành công)
  addCollection: (newCollection) => {
    set((state) => ({
      collections: [...state.collections, newCollection],
    }));
  },
}));
```

---

## Phân loại State — Khi nào dùng gì?

| Loại State | Dùng khi | Tool |
|---|---|---|
| UI local | Modal open/close, input tạm thời | `useState` |
| Global app | Collections, active request, environments | **Zustand** |
| Server data | Danh sách từ API, có cache | **React Query** |
| URL state | Filter, pagination, active tab | URL params |

---

## Styling với TailwindCSS

```jsx
{/* ✅ ĐÚNG: Dùng Tailwind utility classes */}
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
  Gửi Request
</button>

{/* ❌ SAI: Inline style (trừ giá trị dynamic) */}
<button style={{ padding: '8px 16px', backgroundColor: '#2563EB' }}>
  Gửi Request
</button>

{/* ✅ OK: Dynamic value dùng inline style */}
<div style={{ width: `${progress}%` }} className="h-2 bg-blue-500 rounded" />
```

---

## Design Tokens bắt buộc

> Khi làm frontend, phải chốt token trước rồi mới làm component/page. Không được scale font, màu, spacing theo cảm tính ở từng màn riêng lẻ.

### 1. Font family

- **Primary UI font**: `Inter`
- **Display / Heading font**: vẫn dùng `Inter`, weight đậm hơn, tracking âm hơn
- Chỉ đổi sang font khác như `Satoshi` / `General Sans` nếu toàn web đã đổi đồng bộ

```js
fontFamily: {
  sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
}
```

### 2. Typography scale chuẩn

| Token | Mobile | Desktop | Line-height | Dùng cho |
|---|---|---|---|---|
| `caption` | 12px | 12-13px | 1.45 | meta text, note nhỏ |
| `label` | 13px | 14px | 1.45-1.5 | label, tab, chip |
| `body-sm` | 14px | 15-16px | 1.6-1.65 | mô tả ngắn, card text |
| `body` | 15-16px | 16px | 1.68-1.75 | nội dung mặc định |
| `body-lg` | 16px | 17-18px | 1.65-1.72 | intro text / lead |
| `title-sm` | 20-22px | 22-24px | 1.2-1.28 | card title / widget title |
| `title-md` | 28-32px | 36-40px | 1.1-1.16 | section title |
| `title-lg` | 40-48px | 56-72px | 0.98-1.05 | hero title |

### 3. Heading H1 → H6 quy chuẩn

| Tag | Token khuyến nghị | Ghi chú |
|---|---|---|
| `h1` | `title-lg` | chỉ dùng 1 lần chính / page |
| `h2` | `title-md` | section title |
| `h3` | `title-sm` | card heading / block heading |
| `h4` | giữa `label` và `body-lg` | sub-block heading |
| `h5` | `body` đậm | meta heading |
| `h6` | `label` đậm | badge/group label |

### 4. Letter spacing

- `h1`: `-0.06em` đến `-0.08em`
- `h2`: `-0.04em` đến `-0.05em`
- `h3`: `-0.02em` đến `-0.04em`
- Body text: bình thường, không ép tracking âm

### 5. Color system

> Chỉ dùng 1 hệ màu chủ đạo cho mỗi visual direction. Với style hiện tại kiểu marketplace premium sáng:

- `ink`: `#1f2937`
- `paper`: `#f7f5f3`
- `surface`: `#ffffff`
- `surfaceSoft`: `#fbfaf9`
- `line`: `rgba(15,23,42,0.08)`
- `accent`: `#ef4444`
- `accentSoft`: `#fb7185`
- `electric`: `#4f46e5`
- `muted`: `#6b7280`
- `softRose`: `#fff1ef`
- `softBlue`: `#eef2ff`
- `softMint`: `#eefaf4`
- `softGold`: `#fff7e8`

### 6. Radius

- Button / chip nhỏ: `rounded-xl` đến `rounded-2xl`
- Card chuẩn: `rounded-[1.5rem]` đến `rounded-[2rem]`
- Hero / panel lớn: `rounded-[2rem]` đến `rounded-[2.2rem]`

### 7. Shadow

- Card thường: nhẹ, sạch, không đục nền
- Hover: chỉ nhấc nhẹ, không phóng quá tay
- Không dùng shadow quá nặng nếu giao diện đang theo hướng marketplace/light premium

### 8. Desktop vs mobile

- Mobile:
  - giảm `h1` rõ rệt (`text-2xl` đến `text-3xl`)
  - giảm khoảng trắng theo chiều ngang (`p-4` đến `p-5`)
  - card stack 1 cột
  - **Ultra-Compact Standards (Mới)**: Xem chi tiết tại mục 14.
- Desktop:
  - ưu tiên `max-width` thay vì kéo full width
  - hero text chỉ nên chiếm khoảng `8-11` từ/line
  - right rail chỉ xuất hiện khi còn đủ không gian

### 9. Quy tắc áp dụng

- Không set font-size trực tiếp cho từng page nếu đã có token
- Ưu tiên class token như `.type-title-md`, `.body-lg`, `.type-label`
- Khi thấy tỉ lệ lệch, sửa token trung tâm trước rồi mới sửa component
- Nếu một page “đẹp riêng” nhưng lệch token chung thì vẫn phải kéo về token chung

### 10. Quy chuẩn thẻ text cơ bản

| Thẻ | Token / Quy chuẩn | Ghi chú |
|---|---|---|
| `h1` | `title-lg` hoặc `title-xl` | chỉ 1 hero title chính / page |
| `h2` | `title-md` | section title |
| `h3` | `title-sm` | card title / widget title |
| `h4` | `body-lg` + `font-semibold` | subheading |
| `h5` | `body` + `font-semibold` | heading phụ nhỏ |
| `h6` | `label` + `font-semibold` + uppercase nếu cần | meta heading |
| `p` | `body` hoặc `body-sm` | nội dung mặc định, không để line-height quá sít |
| `span` | giữ inherit từ parent | chỉ set size riêng nếu là badge/meta |
| `small` | `caption` | note nhỏ, helper text |
| `strong` | inherit size + tăng weight | không tự ý tăng cỡ chữ |
| `label` | `label` | form label phải rõ ràng, không nhỏ quá |
| `input` | `body-sm` hoặc `body` | desktop tối thiểu 14-16px |
| `textarea` | `body-sm` hoặc `body` | line-height phải thoáng |
| `button` | `label` hoặc `body-sm` + `font-semibold` | button text không được nhỏ quá |
| `li` | `body` hoặc `body-sm` | list dài phải giữ line-height ổn định |

### 11. Quy chuẩn spacing cho text block

- Hero title:
  - `margin-bottom`: `16-24px`
  - line dài tối đa khoảng `8-12 từ`
- Section title:
  - cách eyebrow/meta label khoảng `8-12px`
  - cách paragraph mô tả khoảng `12-18px`
- Paragraph thường:
  - không để line quá dài, ưu tiên `45-70ch`
- Card title:
  - cách meta/status `8-12px`
  - cách description `8-12px`
- List item:
  - spacing dọc đều, không nhồi text sát nhau

### 12. Quy chuẩn mobile / desktop cho hero

- Mobile:
  - hero title ưu tiên `3-4 dòng`, không cố nhét 1-2 dòng
  - line-height khoảng `1.0-1.08`
  - paragraph lead giữ `15-16px`
- Desktop:
  - hero title ưu tiên `2-3 dòng`
  - không để block title kéo quá cao làm mất cân đối với card bên phải
  - nếu title vượt `3 dòng`, phải giảm width block hoặc giảm scale trước khi thêm line break thủ công

### 13. Quy chuẩn visual hierarchy

- Một khối chỉ có **1** điểm nhấn lớn nhất
- Nếu `h1` đã rất lớn, card bên cạnh phải nhỏ hơn rõ rệt
- Không để:
  - title quá lớn
  - paragraph quá nhỏ
  - chip/meta quá đậm
- Tương quan nên là:
  - `Hero title` > `Section title` > `Card title` > `Body` > `Meta`

---

## UI Components bắt buộc

```jsx
// ✅ ĐÚNG: Dùng Modal component
import Modal from '../ui/Modal';
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Xác nhận xóa">
  <p>Bạn có chắc muốn xóa collection này?</p>
</Modal>

// ❌ SAI: Dùng confirm() của trình duyệt
if (window.confirm('Bạn có chắc?')) { deleteCollection(); }

// ✅ ĐÚNG: Dùng Toast
import { useToast } from '../hooks/useToast';
const { showToast } = useToast();
showToast({ type: 'success', message: 'Đã tạo collection thành công!' });

// ❌ SAI: Dùng alert()
alert('Đã tạo thành công!');
```

---

## Loading State & Skeleton

```jsx
// ✅ ĐÚNG: Dùng skeleton thay cho text loading trần
function StoryCardSkeleton() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="animate-pulse space-y-4">
        <div className="h-40 rounded-xl bg-stone-200" />
        <div className="h-6 w-2/3 rounded bg-stone-200" />
        <div className="h-4 w-full rounded bg-stone-100" />
        <div className="h-4 w-5/6 rounded bg-stone-100" />
      </div>
    </div>
  );
}
```

**Quy tắc loading:**
- Không hiển thị đơn thuần kiểu `Đang tải...` nếu khu vực đó là nội dung chính của page
- Dùng **skeleton layout giống cấu trúc thật** để tránh nhảy layout khi data về
- Skeleton phải giữ đúng chiều cao/spacing gần với UI thật
- Dùng `animate-pulse` hoặc shimmer nhẹ, tránh animation gây chói
- Với danh sách, render `3-8` skeleton item tùy context thay vì spinner trống
- Chỉ dùng spinner/text loading cho action nhỏ hoặc inline state rất ngắn
- Khi vừa có loading vừa có empty state, skeleton phải xuất hiện trước, empty state chỉ hiện khi request hoàn tất và không có data

**Ưu tiên UX:**
- Header, sidebar, card list, comment block, account panel, transaction list đều nên có skeleton riêng
- Skeleton nên tái sử dụng qua component thay vì lặp JSX loading ở nhiều page
- Với giao diện lấy cảm hứng feed như Facebook, ưu tiên block skeleton theo card/content line hơn là spinner ở giữa màn hình

---

## 7. Validation & Form Rules

### Quy tắc hiển thị
- **Bắt buộc**: Các trường `required` phải có dấu `(*)` màu đỏ (`text-rose-500`) ngay sau label.
- **Giới hạn ký tự**: Nếu trường có `minLength` hoặc `maxLength`, phải hiển thị gợi ý nhỏ bên dưới hoặc bên phải label (ví dụ: `Tối đa 200 ký tự`).
- **Trạng thái lỗi**: Khi có lỗi, border của input/select phải chuyển sang màu đỏ (`border-rose-500`) và có hiệu ứng rung nhẹ (optional).

### Quy tắc thông báo (Message)
- **Ngôn ngữ**: Phải sử dụng **tiếng Việt** 100% (ví dụ: "Vui lòng nhập trường này", "Mật khẩu phải từ 6-20 ký tự").
- **Vị trí**: Thông báo lỗi phải hiển thị ngay dưới input tương ứng, font chữ nhỏ (`text-[11px]`), màu đỏ (`text-rose-500`).

### Quy tắc tương tác (Interaction)
- **Focus**: Khi người dùng nhấn Submit mà có lỗi, hệ thống phải tự động **Focus** vào trường lỗi đầu tiên.
- **Real-time**: Có thể validate ngay khi người dùng `blur` khỏi input hoặc khi đang gõ (debounce nếu cần).
- **Clear error**: Phải xóa thông báo lỗi ngay khi người dùng bắt đầu sửa lại trường đó.

---

## 9. Quy chuẩn Layout Admin & Responsive

### Header & Actions
- **Tiêu đề trang**: Luôn nằm bên trái, sử dụng font đậm (`font-black` hoặc `font-bold`).
- **Nút hành chính (Thêm mới)**: Phải nằm **cùng hàng** với tiêu đề trang, đẩy về phía bên phải (`float-right` hoặc dùng `flex-between`).
- **Mobile**: Trên màn hình nhỏ, nút "Thêm mới" có thể thu gọn chỉ hiện icon `+` nhưng vẫn phải giữ cùng hàng với tiêu đề.

### Toolbar (Search & Filter)
- **Sắp xếp**: Ô tìm kiếm (Search) và nút Bộ lọc (Filter) phải nằm trên **cùng một hàng ngang** (single row).
- **Mobile**: Không được để Search và Filter nhảy thành 2 dòng làm mất không gian hiển thị dữ liệu.

### List View & Responsive Card
- **Chống tràn ngang (Scroll-X)**: 
  - Thẻ bao ngoài (Card) phải có `max-w-full`.
  - Các phần tử chứa text dài (Title, Description) bắt buộc dùng `min-w-0` và `truncate`.
- **Menu Hành động (Mobile)**:
  - Tuyệt đối không để các nút Sửa/Xóa hiện trực tiếp trên Card ở Mobile nếu gây tràn ngang.
  - Sử dụng icon **3 chấm ngang** (`MoreHorizontal`) để mở Dropdown Menu chứa các hành động.
  - Dropdown Menu phải có `z-index` cao và parent card phải để `overflow-visible` khi menu mở.

### Skeleton Loading Pattern
- **Đồng bộ**: Phải có đủ Skeleton cho cả Desktop (Table) và Mobile (Card).
- **Thời điểm**: Skeleton hiện ngay khi `isLoading = true`, biến mất chỉ khi dữ liệu đã về hoặc có lỗi.

---

## 14. Ultra-Compact Mobile Design Standards (Bắt buộc)

> Khi làm giao diện Mobile cho các trang quản lý tài khoản, hồ sơ hoặc form nạp tiền, phải tuân thủ bộ thông số thu gọn để tránh thừa khoảng trắng và tối ưu diện tích hiển thị.

### 1. Spacing & Padding
- **Panel/Card Padding**: `p-4` (16px) thay vì `p-6/p-8`.
- **Vertical Gap**: `gap-3` hoặc `gap-4` (12px-16px) thay vì `gap-6/gap-8`.
- **Header Padding**: `p-4` hoặc `p-5` cho các section tiêu đề.

### 2. Component Scaling
- **Avatar Size**: `h-14 w-14` (56px) đến `h-16 w-16` (64px). Không dùng size desktop `h-24` trên mobile.
- **Form Inputs**: Padding dọc `py-2.5` (10px). Text size `text-sm`.
- **Action Buttons**: Padding dọc `py-2.5` (10px). Text size `text-xs` hoặc `text-[13px]`, font `font-bold`.

### 3. Visual Attributes
- **Radius**: `rounded-2xl` (16px) thay vì `rounded-3xl` hoặc `rounded-[2.5rem]`. Bo góc quá lớn trên khối nhỏ sẽ tạo cảm giác mất cân đối.
- **Typography**: 
  - `h1` (Main Title): `text-2xl` hoặc `text-[1.5rem]`, tracking `-0.04em`.
  - `h2` (Section Title): `text-lg` hoặc `text-xl`.

### 4. Interactive Elements
- **Touch Targets**: Dù thu nhỏ nhưng chiều cao tối thiểu của button/input phải đạt `40px` (tương đương `py-2.5` + text) để đảm bảo dễ bấm.
- **Gaps**: Giữa Label và Input dùng `space-y-1.5`.

### 16. Image & Media Handling
- **Fallback Mechanism**: 
  - **Bắt buộc**: Mọi thẻ `img` hiển thị dữ liệu động từ API phải có thuộc tính `onError`.
  - **Logic**: Nếu ảnh lỗi hoặc không có (null/empty), phải hiển thị ảnh Placeholder mặc định.
  - **Implementation**: Ưu tiên sử dụng component chung như `ImageWithFallback` để quản lý logic này tập trung.
  - **No Empty States**: Tuyệt đối không để hiện icon "Broken Image" của trình duyệt trên giao diện.
- **Upload & Preview**:
  - Khi người dùng chọn file, phải hiển thị **Preview** ngay lập tức bằng `URL.createObjectURL(file)`.
  - Sử dụng `FormData` để gửi file lên API.
  - Sau khi upload thành công, API phải trả về link tuyệt đối để hiển thị lại.
  - Đối với avatar, nên có icon máy ảnh hoặc nút "Thay đổi" đè lên ảnh đại diện để người dùng dễ nhận biết.

---

## 15. Lưu ý quan trọng

1. **`useCallback` và `useMemo`**: Chỉ dùng khi có performance issue thực sự, không dùng trước khi cần.
2. **Key trong list**: Dùng ID từ DB, không dùng index — `key={item.id}` không phải `key={index}`.
3. **Error boundary**: Bọc các feature lớn trong ErrorBoundary để tránh crash toàn trang.
4. **Lazy loading**: Import page bằng `React.lazy()` để giảm bundle size ban đầu.
