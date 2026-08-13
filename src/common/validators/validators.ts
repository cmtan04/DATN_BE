import { Transform } from 'class-transformer';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function Trim() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}

export function IsAfter(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfter',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];

          // Nếu 1 trong 2 field rỗng thì bỏ qua (để @IsNotEmpty xử lý)
          if (!value || !relatedValue) return true;

          const startDate = new Date(relatedValue);
          const endDate = new Date(value);

          return endDate > startDate; // Trả về true nếu hợp lệ
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} phải lớn hơn hoặc bằng ${relatedPropertyName}`;
        },
      },
    });
  };
}
