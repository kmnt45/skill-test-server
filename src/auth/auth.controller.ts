import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ConfigService } from "@nestjs/config";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService, // <== Внедри ConfigService
  ) {}

  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.register(dto);

    const secure = process.env.NODE_ENV === "production";

    res.cookie("accessToken", data.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge:
        Number(this.configService.get<string>("JWT_ACCESS_EXPIRES_MS")) ||
        1000 * 60 * 15, // 15 минут
    });

    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge:
        Number(this.configService.get<string>("JWT_REFRESH_EXPIRES_MS")) ||
        1000 * 60 * 60 * 24 * 7, // 7 дней
    });

    return { user: data.user };
  }

  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.login(dto);

    const secure = process.env.NODE_ENV === "production";

    res.cookie("accessToken", data.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge:
        Number(this.configService.get<string>("JWT_ACCESS_EXPIRES_MS")) ||
        1000 * 60 * 15,
    });

    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge:
        Number(this.configService.get<string>("JWT_REFRESH_EXPIRES_MS")) ||
        1000 * 60 * 60 * 24 * 7,
    });

    return { user: data.user };
  }

  @Get("refresh")
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies["refreshToken"];
    if (!refreshToken) {
      throw new UnauthorizedException("Отсутствует refresh токен");
    }

    const data = await this.authService.refresh(refreshToken);

    const secure = process.env.NODE_ENV === "production";

    res.cookie("accessToken", data.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge:
        Number(this.configService.get<string>("JWT_ACCESS_EXPIRES_MS")) ||
        1000 * 60 * 15,
    });

    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge:
        Number(this.configService.get<string>("JWT_REFRESH_EXPIRES_MS")) ||
        1000 * 60 * 60 * 24 * 7,
    });

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    };
  }

  @Post("restore")
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      message:
        "Если email зарегистрирован, вы получите письмо со ссылкой для сброса пароля",
    };
  }

  @Post("reset-password")
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: "Пароль успешно изменён" };
  }
}
