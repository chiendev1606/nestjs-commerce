import { z } from 'zod'

export const languageSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdById: z.string(),
  updatedById: z.string(),
  deletedAt: z.date().nullable(),
})

export type LanguageType = z.infer<typeof languageSchema>

export const createLanguageBodySchema = languageSchema.pick({
  name: true,
  id: true,
})

export type CreateLanguageBodyType = z.infer<typeof createLanguageBodySchema>

export const updateLanguageBodySchema = languageSchema.pick({
  name: true,
})

export type UpdateLanguageBodyType = z.infer<typeof updateLanguageBodySchema>
