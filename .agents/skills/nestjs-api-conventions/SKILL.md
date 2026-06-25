---
name: nestjs-api-conventions
description: Coding convention and API design standard for this NestJS backend — controllers, services, repositories, DTOs, validation, error handling, and security. Use this skill whenever creating or modifying a controller, service, repository, DTO, module, or any REST endpoint in this codebase, whenever the user asks to "add an API", "create an endpoint", "add a route", "scaffold a CRUD", review a pull request touching backend code, or whenever generated code would otherwise drift from the patterns below (e.g. business logic in a controller, raw `any` responses, unguarded routes, or DB errors leaking to clients). Always consult this skill before writing NestJS controller/service/DTO code, even for small additions.
---

# NestJS API Conventions

Quy chuẩn bắt buộc cho REST API trong backend NestJS này. Rút ra từ code thực tế của project — tuân theo nghiêm ngặt, không tự sáng tạo pattern khác trừ khi người dùng yêu cầu rõ.

## Kiến trúc phân lớp (bắt buộc)

```
Controller → Service → Repository → Entity
```

- **Controller**: chỉ nhận request, gọi service, trả response. KHÔNG chứa business logic, KHÔNG query DB trực tiếp.
- **Service**: chứa business logic, gọi Repository để truy cập dữ liệu. KHÔNG tự viết raw query trong service.
- **Repository**: lớp duy nhất được phép truy cập DB/ORM trực tiếp.
- **Entity**: định nghĩa ở `@/entities/<name>.entity`.
- **Enum nghiệp vụ**: định nghĩa ở `@/assets/enum/<name>.enum`.

Mọi method ở Controller và Service phải khai báo kiểu trả về rõ ràng (`Promise<XxxResponseDto>` hoặc `Promise<void>`). Không dùng `Promise<any>`.

## Cấu trúc thư mục project

```
src/
├── app.module.ts, main.ts, data-source.ts, swagger.config.ts
├── assets/
│   ├── constant/   - hằng số nghiệp vụ (location.constant.ts...)
│   ├── enum/       - enum nghiệp vụ (payment.enum.ts, user.enum.ts...)
│   ├── interface/  - interface dùng chung (auth.interface.ts...)
│   └── types/
├── common/
│   ├── decorators/ - @Public(), @Role(), @User()
│   ├── guards/     - role.guard.ts (RolesGuard)
│   ├── jwt/        - jwt.guard.ts, jwt.strategy.ts
│   ├── validators/ - custom class-validator decorator dùng chung
│   ├── cloudinary/ - config tích hợp third-party
│   └── express.d.ts - mở rộng type cho Express Request (vd: req.user)
├── controllers/
│   ├── <domain>.controller.ts        - controller thường
│   ├── admin/<name>.controller.ts    - route dành riêng cho admin
│   └── owner/<name>.controller.ts    - route dành riêng cho owner (chủ location)
├── dtos/
│   ├── <domain>.dto.ts               - domain nhỏ, gộp chung 1 file
│   └── <domain>/<action>.dto.ts      - domain lớn, nhiều action, tách theo action
├── entities/
│   ├── base.entity.ts                - BaseEntity, mọi entity phải extends
│   ├── <name>.entity.ts               - entity đơn, không có entity con liên quan
│   └── <domain>/<name>.entity.ts      - domain có nhiều entity liên quan (location/, user/)
├── migrations/    - TypeORM migration, đặt tên theo timestamp
├── modules/       - 1 module NestJS cho mỗi domain
├── repositories/  - 1 repository cho mỗi domain
├── services/
│   ├── <domain>.service.ts
│   └── admin/<domain>.service.ts (hoặc owner/ tương tự) khi service riêng cho sub-domain
├── seed/          - data seeder cho test/dev
├── types/         - file khai báo type cho thư viện ngoài (*.d.ts)
└── utils/         - hàm thuần (pure function) tái sử dụng
```

Khi tạo domain mới, tạo đủ bộ: `modules/<name>.module.ts`, `controllers/<name>.controller.ts`, `services/<name>.service.ts`, `repositories/<name>.repository.ts`, `dtos/<name>.dto.ts` (hoặc `dtos/<name>/` nếu nhiều action), `entities/<name>.entity.ts` nếu cần bảng mới.

**Controller theo sub-domain (`admin/`, `owner/`):**
- Route admin nằm dưới prefix riêng (ví dụ `@Controller('admin/host')`), không gộp chung prefix với route thường.
- Mọi route trong `controllers/admin/` **bắt buộc** gắn `@Role(UserRole.Admin)` ở method hoặc class — không có route admin nào public hoặc chỉ-cần-login mà thiếu role check.
- Route trong `controllers/owner/` tương tự, dùng `@Role(UserRole.Owner)` (hoặc role tương ứng) theo cùng logic — phải gắn rõ, không suy luận từ tên file.

## Quy tắc tạo & cấu hình Module (bắt buộc)

- **TypeORM**: Mọi Entity sử dụng trong module phải được nạp vào `imports: [TypeOrmModule.forFeature([TênCácEntity])]`.
- **Providers (DI)**: Cả Service và Custom Repository (những class gắn `@Injectable()`) đều phải được khai báo trong mảng `providers: []`. Tuyệt đối không được quên Custom Repository dẫn đến lỗi Dependency Injection.
- **Export**: Chỉ ưu tiên export Service (`exports: [XxxService]`). **KHÔNG** export Repository để các module khác gọi trực tiếp trừ khi thực sự cần thiết (nhằm đảm bảo tính đóng gói, mọi business logic và truy xuất DB của một domain nên thông qua Service của domain đó).
- **AppModule**: MỌI module mới được tạo ra (`<name>.module.ts`) đều phải tự động được import vào mảng `imports` của file `src/app.module.ts`.

## Quy ước Entity

- Mọi entity **bắt buộc `extends BaseEntity`** (`@/entities/base.entity.ts`), không tự khai báo lại `id`, `createdAt`, `updatedAt`.
- `BaseEntity` cung cấp: `id` (auto-increment number), `createdAt`, `updatedAt`, `deletedAt` (soft-delete, nullable).
- **Soft-delete bắt buộc tôn trọng** ở mọi query: dùng method chuẩn của TypEORM Repository (`find`, `findOne`, `softDelete`...) để tự động filter `deletedAt IS NULL`. Nếu viết raw SQL hoặc QueryBuilder thủ công (`createQueryBuilder`), PHẢI tự thêm điều kiện `deletedAt IS NULL` — đây là lỗi dễ leak dữ liệu đã xóa nếu quên.
- Xóa dữ liệu nghiệp vụ dùng `softDelete`/`@DeleteDateColumn`, không dùng hard `delete` trừ khi có yêu cầu rõ ràng (ví dụ tác vụ dọn dữ liệu định kỳ, hoặc admin xóa vĩnh viễn có chủ đích).
- Đặt entity thẳng trong `entities/<name>.entity.ts` khi domain chỉ có 1 entity độc lập. Đặt trong `entities/<domain>/` khi domain có nhiều entity liên quan tới nhau (ví dụ `location/`: `location.entity.ts`, `location-address.entity.ts`, `location_media.entity.ts`...).

## Naming convention

| Đối tượng | Convention | Ví dụ |
|---|---|---|
| Route path | kebab-case | `sign-up`, `reset-password` |
| Method, biến | camelCase | `signUp`, `refreshToken` |
| Class, DTO, Entity | PascalCase | `SignInRequestDto`, `AuthService` |
| File | camelCase hoặc kebab-case theo loại | `signIn.dto.ts`, `auth.controller.ts` |
| Request DTO | `<Action>RequestDto` | `SignUpRequestDto` |
| Response DTO | `<Action>ResponseDto` | `SignInResponseDto` |

## Controller pattern

```typescript
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  public async createBooking(
    @Body() payload: CreateBookingRequestDto,
    @User() user: AuthUser,
  ): Promise<CreateBookingResponseDto> {
    return await this.bookingService.createBooking(payload, user.id);
  }
}
```

- Method luôn `public async`.
- Luôn `return await` (không trả Promise chưa resolve), để stack trace lỗi giữ nguyên ở đúng layer.
- Lấy user hiện tại qua decorator `@User()`, không tự đọc `req.user`.
- Route public-only mới đánh `@Public()` ở class hoặc method — xem mục Bảo mật bên dưới.

## DTO & Validation (bắt buộc với mọi input từ client)

Dùng `class-validator` + `class-transformer`. Mọi field nhận từ client phải có decorator validate tương ứng — không có field "trần" không kiểm tra.

```typescript
export class CreateBookingRequestDto {
  @ApiProperty({ example: 'owner@test.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({ default: false })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
```

Quy tắc:
- Mọi string field nhận từ user: bắt buộc `@MaxLength(...)` hợp lý — chặn payload quá khổ và giảm rủi ro injection/DoS.
- String field tự do (email, tên...): thêm `@Transform` để trim, tránh whitespace rác gây lỗi so khớp/validate.
- Mọi field public API: thêm `@ApiProperty` / `@ApiPropertyOptional` cho Swagger, kèm `example` thực tế.
- Field optional: `@IsOptional()` đặt **trước** các validator khác.
- **Bắt buộc bật global `ValidationPipe` với `whitelist: true` và `forbidNonWhitelisted: true`** ở `main.ts` (nếu chưa có, đây là lỗ hổng — flag cho người dùng ngay) để tự động strip/reject field lạ không khai báo trong DTO. Đây là tuyến phòng thủ chính chống injection qua body — không tin tưởng dữ liệu thô từ client dưới bất kỳ hình thức nào.
- Không validate input bằng if/else thủ công trong controller hoặc service — luôn qua DTO decorator.

## Response convention

- **Luôn trả qua Response DTO khai báo rõ field** — KHÔNG trả `any[]` / `any` rồi map field thủ công trong service, dù là dữ liệu join nhiều bảng. Khai báo `XxxResponseDto` với đầy đủ field, map từ raw query sang DTO instance.
- Action không cần trả dữ liệu (update/cancel/delete...): trả `Promise<void>`, không trả object rỗng tùy tiện.
- Message xác nhận đơn giản: trả `{ message: string }` (đã thấy ở `resetPassword`, `healthCheck`) — chỉ dùng cho action không có dữ liệu nghiệp vụ để trả.

## Các Quy chuẩn Xử lý Đặc thù

**1. Phân trang (Pagination):**
- **Request API List**: Bắt buộc có các field chuẩn như `page`, `limit` ở Request DTO, sử dụng validator `@IsInt()`, `@Min(1)`, `@Type(() => Number)` để parse từ query string.
- **Response**: API trả về danh sách có phân trang phải tuân thủ format có metadata: trả về một object chứa `data` (mảng entity/DTO) và `meta` (ví dụ `{ total, page, limit, totalPages }`). Không trả về raw array `[]` nếu API đó dự kiến có số lượng bản ghi lớn.

**2. Giao dịch Database (Transactions):**
- Khi một service action yêu cầu ghi (insert/update/delete) vào nhiều bảng liên tiếp (VD: tạo Booking + tạo Payment), **bắt buộc** phải sử dụng transaction (ví dụ `queryRunner.startTransaction()` hoặc custom transaction block) để rollback toàn bộ nếu có một bước lỗi. Tuyệt đối không thả nổi các thao tác ghi rủi ro rời rạc.

**3. File Upload:**
- Khi xây dựng API nhận file từ client (ảnh/tài liệu): Sử dụng `@UseInterceptors(FileInterceptor('file'))` ở Controller. Chuyển tiếp file cho service tương ứng (như CloudinaryService) để xử lý thay vì tự lưu cục bộ, trừ khi có yêu cầu riêng.

## Error handling & Bảo mật (bắt buộc)

**Auth mặc định: JWT Guard global** — mọi route được bảo vệ (yêu cầu access token hợp lệ) trừ khi đánh `@Public()` rõ ràng ở class hoặc method. Khi tạo controller/route mới:
- Mặc định coi route là protected — không tự thêm `@Public()` trừ khi nghiệp vụ thật sự yêu cầu (đăng nhập, đăng ký, quên mật khẩu, health check...).
- Nếu thêm `@Public()`, phải có lý do nghiệp vụ rõ ràng kèm comment ngắn giải thích vì sao route này không cần auth.

**Phân quyền theo role: dùng `@Role(...roles: UserRole[])`** (từ `@/common/decorators/role.decorator`), được enforce bởi `RolesGuard`.
- Cú pháp: `@Role(UserRole.Admin)` hoặc nhiều role `@Role(UserRole.Admin, UserRole.Manager)` — đây là **spread arguments**, KHÔNG truyền array literal (`@Role([UserRole.Admin])` là sai).
- `RolesGuard` chỉ chặn khi route có gắn `@Role(...)`; route không gắn gì thì pass qua (chỉ JWT Guard kiểm tra, không kiểm tra role). Vì vậy: route nào cần giới hạn theo role (admin, manager...) PHẢI gắn `@Role(...)` rõ ràng — không có nó nghĩa là mọi user đã đăng nhập đều gọi được.
- Không tự đặt tên decorator khác (`@Roles()`, `@RequireRole()`...) — tên chuẩn trong project này là `@Role()` (số ít).
- `RolesGuard` ném `ForbiddenException('Forbidden')` khi role không khớp — không tự viết logic check role thủ công trong controller/service.

**Không để lộ thông tin nhạy cảm:**
- Không log `password`, `accessToken`, `refreshToken`, hoặc PII (email, số điện thoại, CCCD...) ra console/log file dưới dạng plain text. Nếu cần log object request, mask các field này trước (ví dụ `password: '***'`).
- Response lỗi trả về client **không bao giờ** chứa message lỗi gốc từ DB/ORM (ví dụ lỗi SQL, stack trace, constraint name). Dùng exception filter để chuẩn hóa thành message nghiệp vụ chung, log chi tiết lỗi gốc ở server, không gửi ra ngoài.
- Không trả khác biệt giữa "email không tồn tại" và "sai mật khẩu" ở message lỗi sign-in — tránh lộ thông tin email nào đã đăng ký (user enumeration).

**Chống injection / validate input:**
- Mọi input từ client phải đi qua DTO + class-validator (xem mục DTO & Validation) — không tin dữ liệu thô.
- Không nội suy giá trị input trực tiếp vào raw SQL string. Dùng query builder/ORM parameterized query của Repository layer.
- Field nhận free-text hiển thị lại cho user khác (note, comment...) cần được sanitize hoặc escape ở tầng hiển thị (frontend) — backend không tự ý "làm sạch" mất dữ liệu gốc nhưng phải giới hạn độ dài (`@MaxLength`) và kiểu dữ liệu chặt.

## Khi review hoặc generate code mới

Checklist nhanh trước khi coi một controller/service là "đạt chuẩn":

- [ ] Controller không chứa business logic hoặc query DB
- [ ] Mọi method có kiểu trả về rõ ràng, không dùng `any`
- [ ] Mọi field input có DTO + validator decorator tương ứng, có `@MaxLength` nếu là string
- [ ] Response trả qua DTO có khai báo field, không trả `any[]` map tay
- [ ] Route mới mặc định protected; `@Public()` chỉ khi có lý do rõ
- [ ] Route cần giới hạn theo role có gắn `@Role(...)` đúng cú pháp (spread args, không phải array)
- [ ] Route trong `controllers/admin/` hoặc `controllers/owner/` có gắn `@Role(...)` tương ứng, không thiếu
- [ ] Entity mới `extends BaseEntity`, không tự khai báo lại id/createdAt/updatedAt
- [ ] Query thủ công (QueryBuilder/raw SQL) có filter `deletedAt IS NULL` nếu cần tôn trọng soft-delete
- [ ] Không log password/token/PII; lỗi DB không leak ra response
- [ ] Naming đúng convention (kebab-case route, PascalCase DTO, camelCase method)
- [ ] Cấu hình Module đầy đủ (đã khai báo Custom Repo vào providers) và tự động import vào AppModule
- [ ] API dạng danh sách có phân trang chuẩn (page/limit ở request, meta ở response)
- [ ] Dùng Transaction nếu Service thực hiện từ 2 thao tác GHI DB trở lên
