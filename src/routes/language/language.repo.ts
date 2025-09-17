import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'

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
}
