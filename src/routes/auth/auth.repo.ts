import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { RegisterBodyType, VerificationCodeType } from './auth.model'
import ms from 'ms'
import { addMilliseconds } from 'date-fns'
import envConfig from 'src/shared/config'

@Injectable()
export class AuthRepository {
  constructor(private readonly prismaService: PrismaService) {}

  createUser(data: RegisterBodyType & { roleId: number }) {
    return this.prismaService.user.create({
      data: {
        email: data.email,
        name: data.name,
        phoneNumber: data.phoneNumber,
        password: data.password,
        roleId: data.roleId,
      },
      omit: {
        password: true,
        totpSecret: true,
      },
    })
  }

  createVerificationCode(data: Pick<VerificationCodeType, 'email' | 'type' | 'code' | 'expiresAt'>) {
    return this.prismaService.verificationCode.upsert({
      where: {
        email: data.email,
      },
      update: {
        code: data.code,
        expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN as ms.StringValue)),
      },
      create: data,
    })
  }
}
