import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { deviceCreateType, RegisterBodyType, VerificationCodeType } from './auth.model'
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
  findUniqueVerificationCode(
    data: Pick<VerificationCodeType, 'email' | 'type' | 'code'>,
  ): Promise<VerificationCodeType | null> {
    return this.prismaService.verificationCode.findFirst({
      where: {
        email: data.email,
        type: data.type,
        code: data.code,
      },
    })
  }

  findUniqueUserIncludeRole(uniqueObject: { email: string } | { id: number }) {
    return this.prismaService.user.findUnique({
      where: uniqueObject,
      include: {
        role: true,
      },
    })
  }

  createDevice(data: Omit<deviceCreateType, 'id'>) {
    return this.prismaService.device.create({
      data: {
        userAgent: data.userAgent,
        ip: data.ip,
        userId: data.userId,
        lastActive: data.lastActive,
        isActive: data.isActive,
        createdAt: data.createdAt,
      },
    })
  }

  createRefreshToken(data: { userId: number; deviceId: number; token: string; expiresAt: Date }) {
    return this.prismaService.refreshToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        deviceId: data.deviceId,
        expiresAt: data.expiresAt,
      },
    })
  }
}
