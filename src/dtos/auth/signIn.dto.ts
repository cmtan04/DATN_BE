export class SignInRequestDto {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export class SignInResponseDto {
  message: string;
  accessToken: string;
  refreshToken?: string;
}
