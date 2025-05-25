import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.register(dto);

    const secure = process.env.NODE_ENV === 'production';

    res.cookie('token', data.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
    });

    res.cookie('refresh_token', data.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
    });

    res.cookie('user_id', data.user.id, {
      httpOnly: false,
      sameSite: 'lax',
      secure,
    });

    return { user: data.user };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.login(dto);

    const secure = process.env.NODE_ENV === 'production';

    res.cookie('token', data.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
    });

    res.cookie('refresh_token', data.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
    });

    res.cookie('user_id', data.user.id, {
      httpOnly: false,
      sameSite: 'lax',
      secure,
    });

    return { user: data.user };
  }

  @Get('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Отсутствует refresh токен');
    }

    const data = await this.authService.refresh(refreshToken);

    const secure = process.env.NODE_ENV === 'production';

    res.cookie('token', data.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
    });

    res.cookie('refresh_token', data.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
    });

    res.cookie('user_id', data.user.id, {
      httpOnly: false,
      sameSite: 'lax',
      secure,
    });

    return { user: data.user };
  }

  @Post('restore')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return {
      message:
        'Если email зарегистрирован, вы получите письмо со ссылкой для сброса пароля',
    };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Пароль успешно изменён' };
  }
}
