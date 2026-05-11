# PHP Laravel Coding Rules — Chi tiết

> Tóm tắt nhanh → xem [`MASTER.md`](./MASTER.md) phần PHP Laravel.

---

## Môi trường & Version

| Thứ | Phiên bản |
|---|---|
| PHP | 8.1+ |
| Laravel | 10.x+ |
| ORM | Eloquent |
| Validation | FormRequest |
| Response format | JsonResource |

---

## Pattern bắt buộc: FormRequest → Controller → Service → Repository → Model

```
FormRequest: Validate input (đặt tại app/Http/Requests/)
Controller:  Gọi service, trả JsonResource — tối đa 30 dòng/method
Service:     Logic nghiệp vụ (app/Services/)
Repository:  Eloquent queries (app/Repositories/)
Model:       Định nghĩa quan hệ, casts, fillable
```

---

## FormRequest — Ví dụ chuẩn

```php
<?php
// app/Http/Requests/CreateProductRequest.php
// Nhiệm vụ: Validate và authorize request — KHÔNG chứa logic nghiệp vụ

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateProductRequest extends FormRequest
{
    // Kiểm tra quyền truy cập
    public function authorize(): bool
    {
        return true; // Hoặc dùng Policy
    }

    // Định nghĩa rules validate
    public function rules(): array
    {
        return [
            'name'        => 'required|string|max:255',
            'price'       => 'required|numeric|min:0',
            'category_id' => 'required|integer|exists:categories,id',
            'description' => 'nullable|string',
        ];
    }

    // Tùy chỉnh thông báo lỗi (tiếng Việt)
    public function messages(): array
    {
        return [
            'name.required'        => 'Tên sản phẩm không được để trống',
            'price.min'            => 'Giá phải lớn hơn hoặc bằng 0',
            'category_id.exists'   => 'Danh mục không tồn tại trong hệ thống',
        ];
    }
}
```

---

## Controller — Ví dụ chuẩn

```php
<?php
// app/Http/Controllers/ProductController.php
// Nhiệm vụ: Nhận request → Gọi service → Trả JsonResource
// KHÔNG chứa logic nghiệp vụ hay Eloquent query

namespace App\Http\Controllers;

use App\Http\Requests\CreateProductRequest;
use App\Http\Resources\ProductResource;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function __construct(private ProductService $productService) {}

    public function index(): JsonResponse
    {
        $products = $this->productService->getAll();
        return response()->json(ProductResource::collection($products));
    }

    public function store(CreateProductRequest $request): JsonResponse
    {
        // $request->validated() chỉ lấy các field đã khai báo trong rules()
        $product = $this->productService->create($request->validated());
        return response()->json(new ProductResource($product), 201);
    }
}
```

---

## Service — Ví dụ chuẩn

```php
<?php
// app/Services/ProductService.php
// Nhiệm vụ: Logic nghiệp vụ — không biết request/response

namespace App\Services;

use App\Repositories\ProductRepository;
use Illuminate\Support\Facades\Cache;

class ProductService
{
    public function __construct(private ProductRepository $productRepository) {}

    public function create(array $data): Product
    {
        // Kiểm tra logic nghiệp vụ
        if ($this->productRepository->existsByName($data['name'])) {
            throw new \Exception('Tên sản phẩm đã tồn tại', 409);
        }

        $product = $this->productRepository->create($data);

        // Xóa cache liên quan sau khi tạo mới
        Cache::forget('products_list');

        return $product;
    }
}
```

---

## Repository — Ví dụ chuẩn

```php
<?php
// app/Repositories/ProductRepository.php
// Nhiệm vụ: Eloquent queries — không chứa business logic

namespace App\Repositories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;

class ProductRepository
{
    // Luôn dùng Eager Loading để tránh N+1
    public function getAll(): Collection
    {
        return Product::with(['category', 'images'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function existsByName(string $name): bool
    {
        return Product::where('name', $name)->exists();
    }

    public function create(array $data): Product
    {
        return Product::create($data);
    }
}
```

---

## Model — Quy tắc

```php
<?php
// app/Models/Product.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    // Các field được phép mass assign
    protected $fillable = ['name', 'price', 'category_id', 'description', 'is_active'];

    // Tự động cast kiểu dữ liệu
    protected $casts = [
        'price'     => 'decimal:2',
        'is_active' => 'boolean',
        'meta'      => 'array', // JSON field tự động decode
    ];

    // Định nghĩa quan hệ
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }
}
```

---

## JsonResource — Chuẩn format response

```php
<?php
// app/Http/Resources/ProductResource.php
// Kiểm soát chính xác field nào trả về client

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'price'       => $this->price,
            'category'    => new CategoryResource($this->whenLoaded('category')),
            'created_at'  => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
```

---

## Migration — Ví dụ chuẩn

```php
<?php
// database/migrations/2026_05_08_000000_create_products_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255)->comment('Tên sản phẩm — unique');
            $table->decimal('price', 12, 2)->comment('Giá bán, đơn vị VNĐ');
            $table->foreignId('category_id')->constrained('categories')
                  ->comment('FK → categories.id');
            $table->boolean('is_active')->default(true)
                  ->comment('true=đang bán, false=ngừng bán');
            $table->timestamps();

            // Index cho các cột thường dùng trong WHERE
            $table->index('category_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        // BẮT BUỘC có down() để rollback được
        Schema::dropIfExists('products');
    }
};
```

---

## Quy tắc PSR-12 quan trọng

- Indent: **4 spaces** (không dùng tab)
- Opening brace `{` của class/function: **cùng dòng** với khai báo (không xuống dòng)
- Visibility: Luôn khai báo `public/protected/private` cho mọi method/property
- Type hints: Khai báo kiểu cho tham số và return type khi có thể

---

## Lưu ý quan trọng

1. **Không dùng `$request->all()`** — dùng `$request->validated()` để tránh mass assignment
2. **Eager Loading bắt buộc** — `Product::with(['category'])` không phải `Product::find()->category`
3. **Cache invalidation** — Xóa cache liên quan sau CREATE/UPDATE/DELETE
4. **Soft Delete** — Dùng `SoftDeletes` trait cho dữ liệu quan trọng, không xóa vật lý
