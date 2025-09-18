import { createZodDto } from 'nestjs-zod'
import { createLanguageBodySchema, updateLanguageBodySchema } from './language.model'

export class CreateLanguageBodyDto extends createZodDto(createLanguageBodySchema) {}

export class UpdateLanguageBodyDto extends createZodDto(updateLanguageBodySchema) {}
