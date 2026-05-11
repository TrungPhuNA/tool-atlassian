# Angular Coding Rules — Chi tiết

> Tóm tắt nhanh → xem [`MASTER.md`](./MASTER.md) phần Angular.

---

## Môi trường & Version

| Thứ | Phiên bản |
|---|---|
| Angular | 17.x+ |
| TypeScript | 5.x |
| State | Signals + RxJS |
| Styling | TailwindCSS 3.x |
| HTTP | HttpClient (Angular built-in) |
| Forms | Reactive Forms |

---

## Cấu trúc thư mục Angular

```
src/
├── app/
│   ├── core/              # Singleton services, guards, interceptors
│   │   ├── services/      # AuthService, ApiService...
│   │   ├── guards/        # AuthGuard...
│   │   └── interceptors/  # TokenInterceptor, ErrorInterceptor
│   ├── shared/            # Component/Pipe/Directive tái sử dụng
│   │   ├── components/    # ButtonComponent, ModalComponent...
│   │   └── pipes/         # CurrencyVndPipe...
│   └── features/          # Feature modules (lazy loaded)
│       ├── product/
│       │   ├── product-list/
│       │   ├── product-form/
│       │   └── product.service.ts
│       └── auth/
├── environments/
│   ├── environment.ts     # Dev config
│   └── environment.prod.ts
└── assets/
```

---

## Standalone Component — Ví dụ chuẩn (Angular 17+)

```typescript
// features/product/product-list/product-list.component.ts
// Mục đích: Hiển thị danh sách sản phẩm với phân trang và tìm kiếm
// Dùng Signals cho state local, inject Service cho data

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../product.service';
import { Product } from '../product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,        // Bắt buộc — không dùng NgModule
  imports: [CommonModule],
  templateUrl: './product-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush, // Performance
})
export class ProductListComponent implements OnInit {
  // Inject service qua inject() — Angular 14+ style
  private productService = inject(ProductService);

  // State dùng Signals (không dùng BehaviorSubject cho state đơn giản)
  products = signal<Product[]>([]);
  isLoading = signal<boolean>(false);
  searchQuery = signal<string>('');

  // Computed tự động re-calculate khi searchQuery thay đổi
  filteredProducts = computed(() =>
    this.products().filter(p =>
      p.name.toLowerCase().includes(this.searchQuery().toLowerCase())
    )
  );

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.productService.getAll().subscribe({
      next: (data) => {
        this.products.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[ProductList] Lỗi tải danh sách:', err);
        this.isLoading.set(false);
      },
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }
}
```

---

## Service — Ví dụ chuẩn

```typescript
// features/product/product.service.ts
// Nhiệm vụ: Tất cả HTTP calls liên quan đến Product
// Component KHÔNG được gọi HttpClient trực tiếp

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' }) // Singleton — không cần khai báo trong providers
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  // Lấy tất cả sản phẩm — trả Observable để component subscribe
  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl).pipe(
      catchError((err) => {
        console.error('[ProductService] Lỗi lấy danh sách:', err);
        throw err;
      })
    );
  }

  create(data: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, data);
  }
}
```

---

## Reactive Forms — Ví dụ chuẩn

```typescript
// Template-driven forms KHÔNG dùng — chỉ dùng Reactive Forms

import { FormBuilder, FormGroup, Validators, inject } from '@angular/core';

export class ProductFormComponent {
  private fb = inject(FormBuilder);

  // Định nghĩa form với validators rõ ràng
  form: FormGroup = this.fb.group({
    name:        ['', [Validators.required, Validators.maxLength(255)]],
    price:       [null, [Validators.required, Validators.min(0)]],
    category_id: [null, Validators.required],
    description: [''],
  });

  // Getter tiện lợi để truy cập controls trong template
  get nameControl() { return this.form.get('name'); }

  onSubmit(): void {
    if (this.form.invalid) return;
    // form.value chỉ lấy raw values, form.getRawValue() lấy cả disabled fields
    this.productService.create(this.form.value).subscribe(...);
  }
}
```

---

## Lazy Loading Routes

```typescript
// app.routes.ts — Luôn lazy load feature modules
export const routes: Routes = [
  {
    path: 'products',
    loadComponent: () =>
      import('./features/product/product-list/product-list.component')
        .then(m => m.ProductListComponent),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
    canActivate: [AuthGuard], // Bảo vệ route
  },
];
```

---

## RxJS — Khi nào dùng?

| Tình huống | Tool |
|---|---|
| State đơn giản (loading, list data) | **Signals** |
| HTTP response | **Observable** (từ HttpClient) |
| Event stream phức tạp (debounce search, combine streams) | **RxJS operators** |
| Shared state giữa nhiều component | **Service + Signal** hoặc **BehaviorSubject** |

```typescript
// ✅ ĐÚNG: Dùng Signal cho state đơn giản
isLoading = signal(false);

// ✅ ĐÚNG: Dùng RxJS cho debounce search
searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(query => this.productService.search(query))
).subscribe(...);
```

---

## Lưu ý quan trọng

1. **Unsubscribe**: Dùng `takeUntilDestroyed()` hoặc `AsyncPipe` trong template để tránh memory leak
2. **OnPush**: Dùng `ChangeDetectionStrategy.OnPush` cho tất cả component để tối ưu performance
3. **Không dùng `any`**: TypeScript strict mode — khai báo interface/type cho mọi data
4. **Interceptor**: Đặt JWT token và error handling tập trung ở interceptor, không lặp lại trong từng service
