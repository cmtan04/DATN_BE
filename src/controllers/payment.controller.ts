import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('payments')
@ApiTags('Payments')
export class PaymentController {
  // Endpoints đã được chuyển sang BookingProcessController (/transactions).
  // Giữ controller rỗng để dự phòng cho các API thuần payment tương lai.
}
