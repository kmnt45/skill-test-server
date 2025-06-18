import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  IsEmail,
  MinLength,
} from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nickName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsUrl({}, { message: "avatarUrl должен быть валидным URL" })
  avatarUrl?: string;

  @IsOptional()
  @IsString({ message: "about должно быть строкой" })
  @MaxLength(300, { message: "Максимум 300 символов" })
  about?: string;
}
