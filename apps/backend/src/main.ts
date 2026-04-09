import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix: all routes start with /api/v1
  app.setGlobalPrefix("api/v1");

  // CORS: allow frontend to make requests
  app.enableCors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true, // allow cookies to be sent
  });

  // Parse cookies (for refresh token)
  app.use(cookieParser());

  // Auto-validate incoming DTOs using class-validator decorators
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not in DTO
      transform: true, // auto-transform payloads to DTO instances
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
}

bootstrap();
