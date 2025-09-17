import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class LanguageService {
  constructor(private readonly prismaService: PrismaService) {}

  async getLanguages() {
    return this.prismaService.language.findMany()
  }
}
