import { createZodDto } from 'nestjs-zod'
import { emptySchema } from './models/request.model'

export class SuccessResDTO {
  statusCode: string
  data: any

  constructor(partial: Partial<SuccessResDTO>) {
    Object.assign(this, partial)
  }
}

export class EmptySchemaDTO extends createZodDto(emptySchema) {}
