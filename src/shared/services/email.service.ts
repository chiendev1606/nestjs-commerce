import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import envConfig from '../config'
import path from 'path'
import fs from 'fs'

const otpTemplate = path.resolve('src/shared/email-templates/otp.html')
const otpTemplateContent = fs.readFileSync(otpTemplate, 'utf8')

@Injectable()
export class EmailService {
  private readonly resend: Resend
  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY)
  }

  sendEmail(payload: { code: string; email: string }) {
    return this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'quocchien1606@gmail.com',
      subject: 'Verification code',
      html: otpTemplateContent.replace('{{code}}', payload.code),
    })
  }
}
