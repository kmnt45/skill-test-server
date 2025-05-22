import { Controller, Get, Param } from '@nestjs/common';
import { QuestionsService } from './questions.service';

@Controller(':categorySlug/questions')
export class QuestionsController {
  constructor(private readonly questionService: QuestionsService) {}

  @Get()
  async getQuestions(
    @Param('categorySlug') categorySlug: string,
  ): Promise<{ slug: string; title: string }[]> {
    return this.questionService.getQuestionsList(categorySlug);
  }

  @Get(':questionSlug')
  async getQuestion(
    @Param('categorySlug') categorySlug: string,
    @Param('questionSlug') questionSlug: string,
  ): Promise<{ content: string }> {
    const content = await this.questionService.getQuestionMarkdown(
      categorySlug,
      questionSlug,
    );
    return { content };
  }
}
