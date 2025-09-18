import { Module } from '@nestjs/common'

import { LanguageController } from './language.controller'
import { LanguageService } from './language.service'
import { LanguageRepo } from './language.repo'

@Module({
  providers: [LanguageService, LanguageRepo],
  controllers: [LanguageController],
})
export class LanguageModule {}
