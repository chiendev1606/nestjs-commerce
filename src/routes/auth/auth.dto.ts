import { IsString } from 'class-validator'
import { createZodDto } from 'nestjs-zod'
import { userSchema } from 'src/shared/models/shared-user.model'
import {
  deviceSchema,
  loginBodySchema,
  messageSchema,
  refreshTokenSchema,
  registerBodySchema,
  sendOtpBodySchema,
  tokenSchema,
} from './auth.model'

export class LoginResDTO extends createZodDto(tokenSchema) {}

export class RegisterBodyDTO extends createZodDto(registerBodySchema) {}

export class RegisterResDTO extends createZodDto(userSchema) {}

export class RefreshTokenResDTO extends LoginResDTO {}

export class LogoutBodyDTO extends RegisterBodyDTO {}

export class LogoutResDTO {
  message: string
  constructor(partial: Partial<LogoutResDTO>) {
    Object.assign(this, partial)
  }
}

export class DeviceDTO extends createZodDto(deviceSchema) {}

export class RefreshTokenDTO extends createZodDto(refreshTokenSchema) {}

export class SendOtpBodyDTO extends createZodDto(sendOtpBodySchema) {}

export class LoginBodyDTO extends createZodDto(loginBodySchema) {}

export class MessageResDTO extends createZodDto(messageSchema) {}

export class RefreshTokenBodyDTO extends createZodDto(tokenSchema.omit({ accessToken: true })) {}
