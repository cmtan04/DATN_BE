export class SignUpRequestDto {
  email: string;
  password: string;
  userName: string;
  fullName: string;
  phoneNumber: string;
}

export class SignUpResponseDto {
  message: string;
}
