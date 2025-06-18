import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "@/users/users.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { UserDocument } from "@/users/schemas/user.schema";
import { ConfigService } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";
import { MailerService } from "@nestjs-modules/mailer";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel("User") private readonly userModel: Model<UserDocument>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  private generateAccessToken(user: UserDocument): string {
    return this.jwtService.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        nickName: user.nickName,
      },
      {
        secret: this.configService.get<string>("JWT_ACCESS_SECRET"),
        expiresIn: this.configService.get<string>("JWT_ACCESS_EXPIRES_IN"),
      },
    );
  }

  private generateRefreshToken(user: UserDocument): string {
    return this.jwtService.sign(
      { sub: user._id.toString() },
      {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRES_IN"),
      },
    );
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const { nickName, email, password } = dto;

    if (await this.usersService.findByNickName(nickName)) {
      throw new ConflictException("Никнейм уже используется");
    }

    if (await this.usersService.findByEmail(email)) {
      throw new ConflictException("Email уже используется");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create(
      nickName,
      email,
      hashedPassword,
    );

    const refreshToken = this.generateRefreshToken(user);
    await this.usersService.setRefreshToken(user._id.toString(), refreshToken);

    return {
      accessToken: this.generateAccessToken(user),
      refreshToken,
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
      throw new UnauthorizedException("Неверный email или пароль");
    }

    const refreshToken = this.generateRefreshToken(user);
    await this.usersService.setRefreshToken(user._id.toString(), refreshToken);

    return {
      accessToken: this.generateAccessToken(user),
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        nickName: user.nickName,
      },
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    try {
      const user = await this.usersService.findByRefreshToken(refreshToken);
      if (!user) throw new UnauthorizedException("Недействительный токен");

      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      });

      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      await this.usersService.setRefreshToken(
        user._id.toString(),
        newRefreshToken,
      );

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          nickName: user.nickName,
        },
      };
    } catch {
      throw new UnauthorizedException("Недействительный refresh токен");
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return;

    const token = uuidv4();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 час

    const hashedToken = await bcrypt.hash(token, 10);
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = expires;
    await user.save();

    const clientUrl = this.configService.get<string>("CLIENT_URL");
    const resetLink = `${clientUrl}/auth/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: "Восстановление пароля",
      template: "forgot-password",
      context: {
        resetLink,
      },
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const users = await this.userModel
      .find({
        resetPasswordExpires: { $gt: new Date() },
      })
      .exec();

    let user: UserDocument | null = null;

    for (const u of users) {
      if (
        u.resetPasswordToken &&
        (await bcrypt.compare(token, u.resetPasswordToken))
      ) {
        user = u;
        break;
      }
    }

    if (!user) {
      throw new UnauthorizedException(
        "Недействительный или просроченный токен",
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken = undefined;

    await user.save();
  }
}
