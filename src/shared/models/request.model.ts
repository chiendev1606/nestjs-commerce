import { z } from 'zod'

export const emptySchema = z.object({})

export type EmptySchemaType = z.infer<typeof emptySchema>
