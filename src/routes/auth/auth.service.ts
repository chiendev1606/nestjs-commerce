import { Injectable } from '@nestjs/common'
import { addMilliseconds } from 'date-fns'
import ms from 'ms'
import envConfig from 'src/shared/config'
import { TypeOfVerificationCode, TypeOfVerificationCodeType } from 'src/shared/constants/auth.constant'
import { generateVerificationCode, isNotFoundPrismaError, isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { EmailService } from 'src/shared/services/email.service'
import { HashingService } from 'src/shared/services/hashing.service'
import { TokenService } from 'src/shared/services/token.service'
import {
  EmailAlreadyExistsException,
  EmailNotFoundException,
  FailedToSendOTPException,
  InvalidOTPException,
  InvalidPasswordException,
  OTPExpiredException,
  RefreshTokenAlreadyUsedException,
  UnauthorizedAccessException,
  UserNotFoundException,
} from './auth.error'
import {
  disable2FABodyType,
  forgotPasswordBodyType,
  LoginBodyType,
  RegisterBodyType,
  SendOtpBodyType,
  tokenType,
} from './auth.model'
import { AuthRepository } from './auth.repo'
import { RolesService } from './roles.service'
import { TwoFactorService } from 'src/shared/services/two-factor.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly rolesService: RolesService,
    private readonly authRepo: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  async validateVerificationCode(email: string, code: string, type: TypeOfVerificationCodeType) {
    const existVerificationCode = await this.authRepo.findUniqueVerificationCode({
      email,
      type,
      code,
    })
    if (!existVerificationCode) {
      throw InvalidOTPException
    }
    if (existVerificationCode.expiresAt < new Date()) {
      throw OTPExpiredException
    }
    await this.authRepo.deleteVerificationCode({ email, type, code })
    return existVerificationCode
  }

  async register(body: RegisterBodyType) {
    try {
      await this.validateVerificationCode(body.email, body.code, TypeOfVerificationCode.Register)

      const clientRoleId = await this.rolesService.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)
      const user = await this.authRepo.createUser({ ...body, password: hashedPassword, roleId: clientRoleId })

      return user
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw EmailAlreadyExistsException
      }
      throw error
    }
  }
  async sendOtp(body: SendOtpBodyType) {
    const existUser = await this.sharedUserRepository.findUniqueUser({ email: body.email })
    if (existUser && body.type === TypeOfVerificationCode.Register) {
      throw EmailAlreadyExistsException
    }
    if (!existUser && body.type === TypeOfVerificationCode.ForgotPassword) {
      throw EmailNotFoundException
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
      throw FailedToSendOTPException
    }
    return verificationCode
  }

  async login(body: LoginBodyType, ip: string, userAgent: string) {
    const user = await this.authRepo.findUniqueUserIncludeRole({ email: body.email })

    if (!user) {
      throw EmailNotFoundException
    }

    const isPasswordMatch = await this.hashingService.compare(body.password, user.password)
    if (!isPasswordMatch) {
      throw InvalidPasswordException
    }

    if (user.totpSecret && body.totpCode) {
      const isTotpMatch = this.twoFactorService.verifyTOTP(user.totpSecret, body.totpCode)
      if (!isTotpMatch) {
        throw InvalidOTPException
      }
    }

    if (body.code) {
      await this.validateVerificationCode(user.email, body.code, TypeOfVerificationCode.Login)
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
        throw RefreshTokenAlreadyUsedException
      }
      throw UnauthorizedAccessException
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
        throw RefreshTokenAlreadyUsedException
      }
      throw UnauthorizedAccessException
    }
  }

  async forgotPassword(body: forgotPasswordBodyType) {
    const user = await this.authRepo.findUniqueUserIncludeRole({ email: body.email })
    if (!user) {
      throw EmailNotFoundException
    }
    await this.validateVerificationCode(body.email, body.code, TypeOfVerificationCode.ForgotPassword)
    const hashedPassword = await this.hashingService.hash(body.password)
    await this.authRepo.updateUser({ id: user.id, password: hashedPassword })
    return { message: 'Password updated successfully' }
  }

  async setupTwoFactor(userId: number) {
    const user = await this.authRepo.findUniqueUserIncludeRole({ id: userId })

    if (!user) {
      throw UserNotFoundException
    }
    const totp = this.twoFactorService.generateTOTP({ email: user.email })

    await this.authRepo.updateUser({ id: user.id, totpSecret: totp.secret.base32 })

    return { secret: totp.secret.base32, url: totp.toString() }
  }

  async disableTwoFactor({ userId, body }: { userId: number; body: disable2FABodyType }) {
    const user = await this.authRepo.findUniqueUserIncludeRole({ id: userId })

    if (!user) {
      throw UserNotFoundException
    }

    if (user.totpSecret && body.totpCode) {
      const isTotpMatch = this.twoFactorService.verifyTOTP(user.totpSecret, body.totpCode)
      if (!isTotpMatch) {
        throw InvalidOTPException
      }
    }

    if (body.code) {
      await this.validateVerificationCode(user.email, body.code, TypeOfVerificationCode.Disable2FA)
    }
    await this.authRepo.updateUser({ id: user.id, totpSecret: null })

    return { message: 'Two-factor authentication disabled successfully' }
  }
}
