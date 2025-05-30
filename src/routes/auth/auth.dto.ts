import { UserStatus } from '@prisma/client'
import { IsString, Length } from 'class-validator'
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

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

const registerBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6).max(20),
    confirmPassword: z.string().min(6).max(20),
    name: z.string(),
    phoneNumber: z.string().min(10).max(11),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'confirmPassword is not match password',
        path: ['password'],
      })
    }
  })

export class RegisterBodyDTO extends createZodDto(registerBodySchema) {}

const userSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  roleId: z.number(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  phoneNumber: z.string(),
  avatar: z.string().nullable(),
  status: z.nativeEnum(UserStatus),
})

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
