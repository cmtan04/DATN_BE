---
name: send-notification-mail
description: Use this skill when asked to implement sending in-app notifications (via database/real-time) or sending emails to users. It outlines the standard services to use and architectural patterns for mail.
---

# Gửi Thông báo và Email (Send Notification & Email)

Skill này cung cấp tiêu chuẩn và hướng dẫn cách triển khai tính năng gửi thông báo (in-app notifications) và gửi email trong dự án backend (NestJS).

## 1. Gửi Thông báo (In-App Notifications)

Hệ thống đã có sẵn `NotificationModule` và `NotificationService` dùng để lưu trữ thông báo vào database và tự động phát sự kiện (emit event) realtime cho người dùng.
**Tuyệt đối không** tự build lại một cơ chế notification từ đầu.

### Quy trình thực hiện:
1. **Inject NotificationService**: Tại service của module cần gửi thông báo, hãy inject `NotificationService`.
2. **Gọi hàm createMany**: Sử dụng hàm `createMany` để gửi thông báo. Hàm này nhận vào mảng `CreateNotificationData` gồm `userId`, `title`, và `message`. Nó sẽ lưu vào DB và tự động dùng `EventEmitter2` bắn ra event `notification.${userId}` để frontend/socket.io bắt.

### Code mẫu:
```typescript
import { Injectable } from '@nestjs/common';
import { NotificationService } from '@/services/notification.service';

@Injectable()
export class YourFeatureService {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  async doSomethingAndNotify(userId: number) {
    // ... logic ...
    
    // Gửi thông báo
    await this.notificationService.createMany([
      {
        userId: userId,
        title: 'Thông báo mới',
        message: 'Bạn vừa hoàn thành một hành động.',
      }
    ]);
  }
}
```

## 2. Gửi Email (Nodemailer)

**Lưu ý quan trọng**: Không khởi tạo trực tiếp `nodemailer.createTransport` bên trong từng service riêng lẻ (như cách code cũ ở `OTP.service.ts` đang làm).

### Quy trình thực hiện:
1. **Kiểm tra MailService**: Kiểm tra xem `MailService` (hoặc `MailModule`) đã tồn tại trong dự án hay chưa (thường ở `src/services/mail.service.ts` hoặc `src/modules/mail.module.ts`).
2. **Tạo MailService (Nếu chưa có)**: Nếu dự án chưa có `MailService` dùng chung, bạn **phải tạo nó trước**. 
   - `MailService` nên được khởi tạo `transporter` một lần duy nhất ở trong constructor.
   - Lấy credentials từ biến môi trường `NODEMAILER_USER` và `NODEMAILER_PASS` (sử dụng `@nestjs/config` hoặc `process.env`).
   - Viết các hàm tái sử dụng như `sendMail(to: string, subject: string, html: string)`.
3. **Sử dụng MailService**: Inject `MailService` vào module cần gửi email và gọi hàm gửi thay vì tự cấu hình `nodemailer`.

### Khởi tạo MailService mẫu (Nếu bạn là người tạo ra nó):
```typescript
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import 'dotenv/config';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
      },
    });
  }

  public async sendMail(to: string, subject: string, html: string): Promise<void> {
    const mailOptions = {
      from: `"Hệ thống" <${process.env.NODEMAILER_USER}>`,
      to,
      subject,
      html,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Lỗi sendMail:', error);
      throw new InternalServerErrorException('Không thể gửi email, vui lòng thử lại sau.');
    }
  }
}
```

### Cách gọi gửi Mail:
```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from '@/services/mail.service'; // Adjust path accordingly

@Injectable()
export class YourFeatureService {
  constructor(
    private readonly mailService: MailService,
  ) {}

  async doSomethingAndSendEmail(email: string) {
    // ... logic ...
    
    await this.mailService.sendMail(
      email,
      'Chào mừng bạn!',
      '<p>Bạn đã đăng ký thành công!</p>',
    );
  }
}
```
