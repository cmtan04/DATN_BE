export class SignInRequestDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export class SignInResponseDto {
  accessToken: string;
  refreshToken: string;
}
