import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private generateAccessToken(user: UserDocument): string {
    return this.jwtService.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        nickName: user.nickName,
      },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
      },
    );
  }

  private generateRefreshToken(user: UserDocument): string {
    return this.jwtService.sign(
      { sub: user._id.toString() },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      },
    );
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const { nickName, email, password } = dto;

    if (await this.usersService.findByNickName(nickName)) {
      throw new ConflictException('Никнейм уже используется');
    }

    if (await this.usersService.findByEmail(email)) {
      throw new ConflictException('Email уже используется');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create(
      nickName,
      email,
      hashedPassword,
    );

    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
      user: {
        id: user._id.toString(),
        email: user.email,
        nickName: user.nickName,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
      user: {
        id: user._id.toString(),
        email: user.email,
        nickName: user.nickName,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }) as { sub: string };

      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException('Пользователь не найден');

      return {
        accessToken: this.generateAccessToken(user),
        refreshToken: this.generateRefreshToken(user),
        user: {
          id: user._id.toString(),
          email: user.email,
          nickName: user.nickName,
        },
      };
    } catch {
      throw new UnauthorizedException('Недействительный refresh токен');
    }
  }
}
