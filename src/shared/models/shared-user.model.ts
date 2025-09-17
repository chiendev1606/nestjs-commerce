import { UserStatus } from '@prisma/client'
import { z } from 'zod'

export const userSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  roleId: z.number().int(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  phoneNumber: z.string(),
  avatar: z.string().nullable(),
  status: z.nativeEnum(UserStatus),
  password: z.string(),
  totpSecret: z.string().nullable(),
})

export type UserType = z.infer<typeof userSchema>
