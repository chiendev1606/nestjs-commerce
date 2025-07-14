import { Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'
import { addMilliseconds } from 'date-fns'
import ms from 'ms'
import envConfig from 'src/shared/config'
import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant'
import { generateVerificationCode, isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { EmailService } from 'src/shared/services/email.service'
import { HashingService } from 'src/shared/services/hashing.service'
import { PrismaService } from 'src/shared/services/prisma.service'
import { TokenService } from 'src/shared/services/token.service'
import { LoginBodyType, RegisterBodyType, SendOtpBodyType, tokenType } from './auth.model'
import { AuthRepository } from './auth.repo'
import { RolesService } from './roles.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prismaService: PrismaService,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly rolesService: RolesService,
    private readonly authRepo: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
  ) {}
  async register(body: RegisterBodyType) {
    try {
      const existVerificationCode = await this.authRepo.findUniqueVerificationCode({
        email: body.email,
        type: TypeOfVerificationCode.Register,
        code: body.code,
      })

      if (!existVerificationCode) {
        throw new UnprocessableEntityException([
          {
            message: 'Verification code is incorrect',
            path: 'code',
          },
        ])
      }

      if (existVerificationCode.expiresAt < new Date()) {
        throw new UnprocessableEntityException([
          {
            message: 'Verification code has expired',
            path: 'code',
          },
        ])
      }

      const clientRoleId = await this.rolesService.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)
      const user = await this.authRepo.createUser({ ...body, password: hashedPassword, roleId: clientRoleId })
      return user
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw new UnprocessableEntityException([
          {
            message: 'Email already exists',
            path: 'email',
          },
        ])
      }
      throw error
    }
  }
  async sendOtp(body: SendOtpBodyType) {
    const existUser = await this.sharedUserRepository.findUniqueUser({ email: body.email })
    if (existUser) {
      throw new UnprocessableEntityException([
        {
          message: 'Email already exists',
          path: 'email',
        },
      ])
    }
    const code = generateVerificationCode()
    const verificationCode = await this.authRepo.createVerificationCode({
      code,
      email: body.email,
      type: body.type,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN as ms.StringValue)),
    })
    const { error } = await this.emailService.sendEmail({ code, email: body.email })
    if (error) {
      throw new UnprocessableEntityException([
        {
          message: 'Failed to send email',
          path: 'email',
        },
      ])
    }
    return verificationCode
  }

  async login(body: LoginBodyType, ip: string, userAgent: string) {
    const user = await this.authRepo.findUniqueUserIncludeRole({ email: body.email })

    if (!user) {
      throw new UnprocessableEntityException([
        {
          message: 'Email is incorrect',
          path: 'email',
        },
      ])
    }

    const isPasswordMatch = await this.hashingService.compare(body.password, user.password)
    if (!isPasswordMatch) {
      throw new UnprocessableEntityException([
        {
          field: 'password',
          error: 'Password is incorrect',
        },
      ])
    }

    const device = await this.authRepo.createDevice({
      userAgent,
      ip,
      userId: user.id,
      lastActive: new Date(),
      isActive: true,
      createdAt: new Date(),
    })

    const tokens = await this.generateTokens({
      userId: user.id,
      roleId: user.roleId,
      deviceId: device.id,
      roleName: user.role.name,
    })

    return tokens
  }

  async generateTokens(payload: { userId: number; roleId: number; deviceId: number; roleName: string }) {
    const tokenPayload = {
      userId: payload.userId,
      roleId: payload.roleId,
      deviceId: String(payload.deviceId),
      roleName: payload.roleName,
    }
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken(tokenPayload),
      this.tokenService.signRefreshToken({ userId: payload.userId }),
    ])
    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)
    await this.authRepo.createRefreshToken({
      userId: payload.userId,
      deviceId: payload.deviceId,
      token: refreshToken,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
    })
    return { accessToken, refreshToken }
  }

  async refreshToken({
    refreshToken,
    ip,
    userAgent,
  }: {
    refreshToken: string
    ip: string
    userAgent: string
  }): Promise<tokenType> {
    try {
      await this.tokenService.verifyRefreshToken(refreshToken)
      await this.authRepo.findUniqueRefreshToken({ token: refreshToken })

      const {
        deviceId,
        user: {
          roleId,
          id: userId,
          role: { name: roleName },
        },
      } = await this.authRepo.findUniqueRefreshToken({ token: refreshToken })

      const $updateDevice = this.authRepo.updateDevice({ id: Number(deviceId), isActive: true, ip, userAgent })

      const $deleteRefreshToken = this.authRepo.deleteRefreshToken({ token: refreshToken })

      const $generateTokens = this.generateTokens({
        userId,
        roleId,
        deviceId,
        roleName,
      })

      const [, , tokens] = await Promise.all([$updateDevice, $deleteRefreshToken, $generateTokens])

      return tokens
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Refresh token has been revoked')
      }
      throw new UnauthorizedException()
    }
  }

  async logout(refreshToken: string) {
    try {
      await this.tokenService.verifyRefreshToken(refreshToken)
      const { deviceId } = await this.authRepo.findUniqueRefreshToken({ token: refreshToken })
      await this.authRepo.updateDevice({ id: Number(deviceId), isActive: false })
      await this.authRepo.deleteRefreshToken({ token: refreshToken })
      return { message: 'Logout successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new UnauthorizedException('Refresh token has been revoked')
      }
      throw new UnauthorizedException()
    }
  }
}
