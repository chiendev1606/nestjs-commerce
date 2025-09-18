import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { CreateLanguageBodyType, UpdateLanguageBodyType } from './language.model'

@Injectable()
export class LanguageRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async findAllLanguages() {
    const data = await this.prismaService.language.findMany()
    return {
      data,
      count: data.length,
    }
  }

  createLanguage(body: CreateLanguageBodyType) {
    return this.prismaService.language.create({
      data: body,
    })
  }

  updateLanguage(body: UpdateLanguageBodyType & { id: string }) {
    return this.prismaService.language.update({
      where: { id: body.id },
      data: body,
    })
  }

  deleteLanguage(id: string) {
    return this.prismaService.language.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}
