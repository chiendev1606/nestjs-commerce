import { Injectable } from '@nestjs/common'
import { PrismaService } from '../services/prisma.service'

@Injectable()
export class SharedUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findUniqueUser(uniqueObject: { email: string } | { id: number }) {
    return this.prismaService.user.findUnique({
      where: uniqueObject,
    })
  }
}
