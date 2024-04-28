import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // await app.listen(3000);
  const portNum = process.env.PORT;
  console.log(`port number is: ${portNum}`);
  await app.listen(portNum);
}
bootstrap();
