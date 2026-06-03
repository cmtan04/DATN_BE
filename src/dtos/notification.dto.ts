export interface NotificationResponseDto {
  id: number;
  title: string;
  message: string;
  userId: number;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

