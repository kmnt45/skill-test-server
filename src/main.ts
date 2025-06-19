import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app/app.module";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import cookieParser from "cookie-parser";
import "dotenv/config";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: configService.get<string>("app.origin"),
    credentials: true,
    methods: "GET,POST,PUT,DELETE,PATCH",
    allowedHeaders: "Content-Type,Authorization",
  });

  app.useStaticAssets(join(__dirname, "..", "..", "uploads"), {
    prefix: "/uploads/",
  });

  app.use(cookieParser());

  app.setGlobalPrefix('api');

  const port = configService.get<number>("app.port") || 5000;
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
