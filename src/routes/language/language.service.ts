import { Injectable } from '@nestjs/common'
import { CreateLanguageBodyType, UpdateLanguageBodyType } from './language.model'
import { LanguageRepo } from './language.repo'

@Injectable()
export class LanguageService {
  constructor(private readonly languageRepo: LanguageRepo) {}

  async getLanguages() {
    return this.languageRepo.findAllLanguages()
  }

  async createLanguage({ name, id }: CreateLanguageBodyType) {
    return this.languageRepo.createLanguage({ name, id })
  }

  async updateLanguage({ name, id }: UpdateLanguageBodyType & { id: string }) {
    return this.languageRepo.updateLanguage({ id, name })
  }

  async deleteLanguage(id: string) {
    return this.languageRepo.deleteLanguage(id)
  }
}
