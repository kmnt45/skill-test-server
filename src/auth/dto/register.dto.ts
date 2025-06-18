import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from "class-validator";

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  nickName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(5)
  @Matches(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{5,}$/, {
    message: "Пароль должен содержать заглавные и строчные буквы и цифры",
  })
  password: string;
}
