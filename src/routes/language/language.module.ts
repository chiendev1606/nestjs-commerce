import { Module } from '@nestjs/common'

import { LanguageController } from './language.controller'
import { LanguageService } from './language.service'

@Module({
  providers: [LanguageService],
  controllers: [LanguageController],
})
export class LanguageModule {}
