---
name: create-endpoint
description: Add a new API endpoint to an existing module. Use this skill when asked to create an API, write a route, or add a function to an existing domain.
---

# Create Endpoint Skill

Sử dụng skill này khi người dùng yêu cầu thêm một chức năng, API mới vào một module đã có sẵn hoặc chỉnh sửa 1 API hiện tại (ví dụ: "Thêm API lấy danh sách user", "Tạo endpoint hủy booking" hay "Sửa API hủy booking").

## Các bước thực hiện bắt buộc:

1. **Kiểm tra Impact (Rất quan trọng nếu sửa API có sẵn)**: Xác định Controller, Service và DTO liên quan. 
   - Trace luồng hiện tại để xem endpoint, hàm trong Service, hoặc DTO có đang được dùng chung bởi các API khác hay không để tránh break code.
   - Đọc qua để hiểu naming convention hiện tại của domain đó.
2. **Tạo/Cập nhật DTO**: Thêm/Sửa Request DTO (nếu API có body/query) và Response DTO.
   - **Lưu ý cô lập thay đổi**: Nếu DTO của API cần sửa đang được dùng chung, hãy tạo DTO mới (ưu tiên dùng `extends`, `PickType`, `OmitType` từ DTO cũ) thay vì sửa trực tiếp DTO cũ để đảm bảo an toàn.
   - Nếu là API List, bắt buộc có `page`, `limit` ở Request DTO và trả về format `meta` ở Response DTO (chuẩn phân trang).
   - Đảm bảo dùng đủ `@ApiProperty`, `class-validator`, và `class-transformer`.
3. **Cập nhật Service và Entity**: Thêm/Sửa method xử lý logic.
   - Nếu thay đổi yêu cầu thêm/sửa cột trong Database, chỉ cần sửa Entity, hệ thống sẽ tự cập nhật cấu trúc DB nhờ `synchronize: true` (không cần tạo file migration).
   - Nếu có từ 2 thao tác ghi (insert/update/delete) DB trở lên, **bắt buộc** dùng Transaction (`queryRunner`).
   - Gọi Repository (bắt buộc dùng soft-delete `deletedAt IS NULL` nếu query bằng tay).
4. **Cập nhật Controller**:
   - Thêm/Sửa decorator `@Get()`, `@Post()`, v.v...
   - Nếu là route public, gắn `@Public()`.
   - Nếu cần phân quyền, gắn `@Role(...)` (dùng spread arguments `UserRole.Admin`).
5. **Kiểm tra và Báo cáo**: Đảm bảo không lộ thông tin nhạy cảm. Trình bày lại các thay đổi với người dùng.

> **LƯU Ý QUAN TRỌNG:**
> Mọi code sinh ra phải tuân thủ nghiêm ngặt skill `nestjs-api-conventions`. KHÔNG đưa logic xử lý vào Controller.
