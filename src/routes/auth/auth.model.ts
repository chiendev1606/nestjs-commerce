import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant'
import { userSchema } from 'src/shared/models/shared-user.model'
import { z } from 'zod'

export const registerBodySchema = userSchema
  .pick({
    email: true,
    name: true,
    phoneNumber: true,
  })
  .extend({
    password: z.string().min(6).max(20),
    confirmPassword: z.string().min(6).max(20),
    code: z.string().length(6),
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

const verificationCodeSchema = z.object({
  id: z.number(),
  email: z.string(),
  code: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  type: z.enum([TypeOfVerificationCode.Register, TypeOfVerificationCode.ForgotPassword]),
})
export const loginBodySchema = z.object({
  email: z.string(),
  password: z.string(),
})
export const sendOtpBodySchema = verificationCodeSchema.pick({
  email: true,
  type: true,
})
export const loginResSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const deviceSchema = z.object({
  id: z.number(),
  ip: z.string(),
  userId: z.number(),
  userAgent: z.string(),
  lastActive: z.date(),
  isActive: z.boolean(),
  createdAt: z.date(),
})

export const refreshTokenSchema = z.object({
  token: z.string(),
  userId: z.number(),
  deviceId: z.number(),
  expiresAt: z.date(),
  createdAt: z.date(),
})

export const tokenSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export type RegisterBodyType = z.infer<typeof registerBodySchema>
export type VerificationCodeType = z.infer<typeof verificationCodeSchema>
export type LoginBodyType = z.infer<typeof loginBodySchema>
export type SendOtpBodyType = z.infer<typeof sendOtpBodySchema>
export type LoginResType = z.infer<typeof loginResSchema>
export type deviceCreateType = z.infer<typeof deviceSchema>
export type refreshTokenType = z.infer<typeof refreshTokenSchema>
export type tokenType = z.infer<typeof tokenSchema>
