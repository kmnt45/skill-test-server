import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller(':categorySlug/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async getTasksList(@Param('categorySlug') categorySlug: string) {
    return await this.tasksService.getTasksList(categorySlug);
  }

  @Get(':taskSlug')
  async getTask(
    @Param('categorySlug') categorySlug: string,
    @Param('taskSlug') taskSlug: string,
  ) {
    return await this.tasksService.getTask(categorySlug, taskSlug);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':taskSlug/submit')
  async submitSolution(
    @Param('categorySlug') categorySlug: string,
    @Param('taskSlug') taskSlug: string,
    @Body() body: { solution: string; language: string },
    @Req() req: Request,
  ) {
    const userId = (req as any).user?._id;
    if (!userId) {
      throw new BadRequestException('Пользователь не аутентифицирован');
    }
    if (!body.solution || typeof body.solution !== 'string') {
      throw new BadRequestException('Решение должно быть строкой');
    }
    if (!body.language || typeof body.language !== 'string') {
      throw new BadRequestException('Язык программирования не указан');
    }

    const taskMeta = await this.tasksService.getTask(categorySlug, taskSlug);
    if (!taskMeta) {
      throw new BadRequestException('Задача не найдена');
    }

    const supportedLanguages = ['javascript', 'typescript'] as const;

    const language = body.language.toLowerCase();
    if (!supportedLanguages.includes(language as any)) {
      throw new BadRequestException('Неподдерживаемый язык программирования');
    }

    return this.tasksService.submitSolution(
      userId,
      categorySlug,
      taskSlug,
      body.solution,
      language as keyof (typeof this.tasksService)['vm2Service']['languageMap'],
      taskMeta.testCases ?? [],
      taskMeta.points,
    );
  }
}
