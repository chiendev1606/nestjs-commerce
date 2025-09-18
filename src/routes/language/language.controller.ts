import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { LanguageService } from './language.service'
import { CreateLanguageBodyDto, UpdateLanguageBodyDto } from './language.dto'

@Controller('language')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Get()
  async getLanguages() {
    return this.languageService.getLanguages()
  }

  @Post('create')
  async createLanguage(@Body() createLanguageDto: CreateLanguageBodyDto) {
    return this.languageService.createLanguage(createLanguageDto)
  }

  @Put('update/:id')
  async updateLanguage(@Body() updateLanguageDto: UpdateLanguageBodyDto, @Param('id') id: string) {
    return this.languageService.updateLanguage({ ...updateLanguageDto, id })
  }

  @Delete('delete/:id')
  async deleteLanguage(@Param('id') id: string) {
    return this.languageService.deleteLanguage(id)
  }
}
