---
name: create-endpoint
description: Add a new API endpoint to an existing module. Use this skill when asked to create an API, write a route, or add a function to an existing domain.
---

# Create Endpoint Skill

Sử dụng skill này khi người dùng yêu cầu thêm một chức năng, API mới vào một module đã có sẵn (ví dụ: "Thêm API lấy danh sách user", "Tạo endpoint hủy booking").

## Các bước thực hiện bắt buộc:

1. **Kiểm tra Module hiện tại**: Xác định Controller, Service và DTO liên quan. Đọc qua để hiểu naming convention hiện tại của domain đó.
2. **Tạo/Cập nhật DTO**: Thêm Request DTO (nếu API có body/query) và Response DTO vào file DTO của domain.
   - Nếu là API List, bắt buộc có `page`, `limit` ở Request DTO và trả về format `meta` ở Response DTO (chuẩn phân trang).
   - Đảm bảo dùng đủ `@ApiProperty`, `class-validator`, và `class-transformer`.
3. **Cập nhật Service**: Thêm method xử lý logic.
   - Nếu có từ 2 thao tác ghi (insert/update/delete) DB trở lên, **bắt buộc** dùng Transaction (`queryRunner`).
   - Gọi Repository (bắt buộc dùng soft-delete `deletedAt IS NULL` nếu query bằng tay).
4. **Cập nhật Controller**:
   - Thêm decorator `@Get()`, `@Post()`, v.v...
   - Nếu là route public, gắn `@Public()`.
   - Nếu cần phân quyền, gắn `@Role(...)` (dùng spread arguments `UserRole.Admin`).
5. **Kiểm tra và Báo cáo**: Đảm bảo không lộ thông tin nhạy cảm. Trình bày lại các thay đổi với người dùng.

> **LƯU Ý QUAN TRỌNG:**
> Mọi code sinh ra phải tuân thủ nghiêm ngặt skill `nestjs-api-conventions`. KHÔNG đưa logic xử lý vào Controller.
