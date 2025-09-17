import { Injectable } from '@nestjs/common'
import { Secret, TOTP } from 'otpauth'
import envConfig from '../config'

@Injectable()
export class TwoFactorService {
  constructor() {}

  generateSecret() {
    return new Secret()
  }

  generateTOTP({ email, secret }: { email?: string; secret?: string }) {
    return new TOTP({
      label: envConfig.APP_NAME,
      issuer: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret || this.generateSecret(),
    })
  }

  verifyTOTP(secret: string, token: string) {
    const totp = this.generateTOTP({ secret })
    const delta = totp.validate({ token, window: 1 })
    return delta !== null
  }
}
