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

export type RegisterBodyType = z.infer<typeof registerBodySchema>

const verificationCodeSchema = z.object({
  id: z.number(),
  email: z.string(),
  code: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  type: z.enum([TypeOfVerificationCode.Register, TypeOfVerificationCode.ForgotPassword]),
})

export type VerificationCodeType = z.infer<typeof verificationCodeSchema>

export const sendOtpBodySchema = verificationCodeSchema.pick({
  email: true,
  type: true,
})

export type SendOtpBodyType = z.infer<typeof sendOtpBodySchema>
