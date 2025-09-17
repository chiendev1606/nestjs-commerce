import { Body, Controller, HttpCode, HttpStatus, Ip, Post } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  disable2FABodyDTO,
  ForgotPasswordBodyDTO,
  LoginBodyDTO,
  LogoutResDTO,
  MessageResDTO,
  RefreshTokenBodyDTO,
  RefreshTokenResDTO,
  RegisterBodyDTO,
  RegisterResDTO,
  SendOtpBodyDTO,
  TwoFASetupResDTO,
} from 'src/routes/auth/auth.dto'
import { AuthService } from 'src/routes/auth/auth.service'
import { ActiveUser } from 'src/shared/decorators/active-user.decorator'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { UserAgent } from 'src/shared/decorators/user-agent.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ZodSerializerDto(RegisterResDTO)
  @Post('register')
  @IsPublic()
  async register(@Body() body: RegisterBodyDTO) {
    return await this.authService.register(body)
  }

  @Post('otp')
  @IsPublic()
  sendOtp(@Body() body: SendOtpBodyDTO) {
    return this.authService.sendOtp(body)
  }

  @IsPublic()
  @Post('login')
  async login(@Body() body: LoginBodyDTO, @Ip() ip: string, @UserAgent() userAgent: string) {
    return this.authService.login(body, ip, userAgent)
  }

  @IsPublic()
  @Post('forgot-password')
  @ZodSerializerDto(MessageResDTO)
  async forgotPassword(@Body() body: ForgotPasswordBodyDTO) {
    return this.authService.forgotPassword(body)
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(RefreshTokenResDTO)
  async refreshToken(@Body() body: RefreshTokenBodyDTO, @Ip() ip: string, @UserAgent() userAgent: string) {
    return this.authService.refreshToken({ refreshToken: body.refreshToken, ip, userAgent })
  }

  @Post('logout')
  @ZodSerializerDto(MessageResDTO)
  async logout(@Body() body: RefreshTokenBodyDTO) {
    return new LogoutResDTO(await this.authService.logout(body.refreshToken))
  }

  @Post('two-factor/setup')
  @ZodSerializerDto(TwoFASetupResDTO)
  setupTwoFactor(@ActiveUser('userId') userId: number) {
    return this.authService.setupTwoFactor(userId)
  }

  @Post('two-factor/disable')
  @ZodSerializerDto(MessageResDTO)
  disableTwoFactor(@ActiveUser('userId') userId: number, @Body() body: disable2FABodyDTO) {
    return this.authService.disableTwoFactor({ userId, body })
  }
}
