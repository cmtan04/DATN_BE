import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config';

//Hot Module Replacement (HMR) - dev mode only
declare const module: {
  hot?: {
    accept(): void;
    dispose(callback: () => void): void;
  };
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  await app.listen(process.env.PORT || 8000);

  module.hot?.accept();
  module.hot?.dispose(() => {
    void app.close();
  });
}
void bootstrap();
