import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  BadRequestException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TestsService } from './tests.service';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller(':categorySlug/tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Get()
  async getTests(@Param('categorySlug') categorySlug: string) {
    return this.testsService.getTestsList(categorySlug);
  }

  @Get(':testSlug/:index')
  async getQuestion(
    @Param('categorySlug') categorySlug: string,
    @Param('testSlug') testSlug: string,
    @Param('index') index: string,
  ) {
    const questionIndex = parseInt(index, 10);
    if (isNaN(questionIndex) || questionIndex < 0) {
      throw new BadRequestException('Неверный индекс вопроса');
    }
    return this.testsService.getQuestion(categorySlug, testSlug, questionIndex);
  }

  @Post(':testSlug/:index/check')
  async checkAnswer(
    @Param('categorySlug') categorySlug: string,
    @Param('testSlug') testSlug: string,
    @Param('index') index: string,
    @Body('answerIndex') answerIndex: number,
  ) {
    const questionIndex = parseInt(index, 10);
    if (isNaN(questionIndex) || questionIndex < 0) {
      throw new BadRequestException('Неверный индекс вопроса');
    }
    if (answerIndex == null || answerIndex < 0) {
      throw new BadRequestException('Неверный индекс ответа');
    }
    return this.testsService.checkAnswer(
      categorySlug,
      testSlug,
      questionIndex,
      answerIndex,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':testSlug/complete')
  async completeTest(
    @Param('categorySlug') categorySlug: string,
    @Param('testSlug') testSlug: string,
    @Body('answers') userAnswers: number[],
    @Req() req: Request,
  ) {
    const userId = (req as any).user?._id;
    if (!userId) {
      throw new BadRequestException('Пользователь не аутентифицирован');
    }
    if (!Array.isArray(userAnswers)) {
      throw new BadRequestException('Ответы должны быть массивом чисел');
    }
    if (
      userAnswers.some((answer) => typeof answer !== 'number' || answer < 0)
    ) {
      throw new BadRequestException('Некорректные данные ответов');
    }

    return this.testsService.completeTest(
      userId,
      categorySlug,
      testSlug,
      userAnswers,
    );
  }
}
