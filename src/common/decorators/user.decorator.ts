import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDecoratorDtoResponse } from '@/dtos/user/user.dto';

export const User = createParamDecorator(
  (
    data: keyof UserDecoratorDtoResponse | undefined,
    ctx: ExecutionContext,
  ): UserDecoratorDtoResponse | string | number | Date | undefined => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = request.user as UserDecoratorDtoResponse;

    if (!data) {
      return user;
    }

    return user[data] as string | number | Date | undefined;
  },
);
