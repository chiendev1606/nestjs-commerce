import { Body, Controller, HttpCode, HttpStatus, Ip, Post, Req } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  LoginBodyDTO,
  LoginResDTO,
  LogoutResDTO,
  RefreshTokenBodyDTO,
  RefreshTokenResDTO,
  RegisterBodyDTO,
  RegisterResDTO,
  SendOtpBodyDTO,
} from 'src/routes/auth/auth.dto'
import { AuthService } from 'src/routes/auth/auth.service'
import { UserAgent } from 'src/shared/decorators/user-agent.decorator'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ZodSerializerDto(RegisterResDTO)
  @Post('register')
  async register(@Body() body: RegisterBodyDTO) {
    return await this.authService.register(body)
  }

  @Post('otp')
  sendOtp(@Body() body: SendOtpBodyDTO) {
    return this.authService.sendOtp(body)
  }

  @Post('login')
  async login(@Body() body: LoginBodyDTO, @Ip() ip: string, @UserAgent() userAgent: string) {
    return this.authService.login(body, ip, userAgent)
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: RefreshTokenBodyDTO, @Ip() ip: string, @UserAgent() userAgent: string) {
    return this.authService.refreshToken({ refreshToken: body.refreshToken, ip, userAgent })
  }

  // @Post('logout')
  // async logout(@Body() body: LogoutBodyDTO) {
  //   return new LogoutResDTO(await this.authService.logout(body.refreshToken))
  // }
}
