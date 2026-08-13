import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';
import { setupSwagger } from './swagger.config';
import { NestExpressApplication } from '@nestjs/platform-express';

//Hot Module Replacement (HMR) - dev mode only
declare const module: {
  hot?: {
    accept(): void;
    dispose(callback: () => void): void;
  };
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // để dùng @Type
      whitelist: true, // để loại bỏ các thuộc tính không có trong dto
    }),
  );

  app.enableCors({
    origin: '*', // Cho phép tất cả các domain (an toàn trong dev/ngrok)
    credentials: true, // Cần thiết cho cookies, auth headers
  });

  setupSwagger(app);

  await app.listen(process.env.PORT || 8080, '0.0.0.0');

  module.hot?.accept();
  module.hot?.dispose(() => {
    void app.close();
  });
}
void bootstrap();
