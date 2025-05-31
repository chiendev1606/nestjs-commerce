import { IsString, Length } from 'class-validator'
import { createZodDto } from 'nestjs-zod'
import { registerBodySchema, sendOtpBodySchema } from './auth.model'
import { userSchema } from 'src/shared/models/shared-user.model'

export class LoginBodyDTO {
  @IsString()
  email: string
  @IsString()
  @Length(6, 20, { message: 'Mật khẩu phải từ 6 đến 20 ký tự' })
  password: string
}

export class LoginResDTO {
  accessToken: string
  refreshToken: string

  constructor(partial: Partial<LoginResDTO>) {
    Object.assign(this, partial)
  }
}

export class RegisterBodyDTO extends createZodDto(registerBodySchema) {}

export class RegisterResDTO extends createZodDto(userSchema) {}

export class RefreshTokenBodyDTO {
  @IsString()
  refreshToken: string
}

export class RefreshTokenResDTO extends LoginResDTO {}

export class LogoutBodyDTO extends RefreshTokenBodyDTO {}

export class LogoutResDTO {
  message: string
  constructor(partial: Partial<LogoutResDTO>) {
    Object.assign(this, partial)
  }
}

export class SendOtpBodyDTO extends createZodDto(sendOtpBodySchema) {}
