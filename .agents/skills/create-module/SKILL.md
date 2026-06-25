---
name: create-module
description: Scaffold a full domain module in NestJS. Use this skill when asked to create a new domain, feature, or module in the project.
---

# Create Module Skill

Sử dụng skill này khi người dùng yêu cầu tạo một module/domain mới (ví dụ: "Tạo module booking", "Làm cho tôi tính năng payment").

## Các bước thực hiện bắt buộc:

1. **Hiểu yêu cầu**: Xác định tên domain (VD: `promotion`), các entity cần thiết, và các API cơ bản (CRUD) nếu người dùng có yêu cầu.
2. **Tạo Entity**: Tạo file `src/entities/<domain>.entity.ts` (hoặc thư mục nếu nhiều entity). Bắt buộc `extends BaseEntity` từ `src/entities/base.entity.ts`.
3. **Tạo DTO**: Tạo file `src/dtos/<domain>.dto.ts` (hoặc thư mục). Khai báo các field với `class-validator` và `class-transformer`.
4. **Tạo Repository**: Tạo file `src/repositories/<domain>.repository.ts`. Khai báo class `@Injectable()` và inject các Entity cần thiết bằng `@InjectRepository()`.
5. **Tạo Service**: Tạo file `src/services/<domain>.service.ts`. Chứa business logic, inject Repository.
6. **Tạo Controller**: Tạo file `src/controllers/<domain>.controller.ts`. Chỉ định nghĩa Route, gọi Service. Bắt buộc gắn `@Role(...)` cho các route nhạy cảm.
7. **Tạo Module**: Tạo file `src/modules/<domain>.module.ts`. 
   - `imports`: `TypeOrmModule.forFeature([CácEntity])`.
   - `controllers`: Khai báo Controller.
   - `providers`: Khai báo Service và Custom Repository.
   - `exports`: Tối đa chỉ export Service nếu cần. KHÔNG export Repository.
8. **Auto-import vào AppModule**: Mở file `src/app.module.ts`, import `<Domain>Module` vào mảng `imports`.

> **LƯU Ý QUAN TRỌNG:**
> Hãy ĐỌC KỸ skill `nestjs-api-conventions` để nắm chắc các quy chuẩn về Pagination, Transaction, Soft Delete và cách dùng Decorator trong project này trước khi bắt đầu code.
