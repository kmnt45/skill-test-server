import { Injectable, BadRequestException } from '@nestjs/common';
import { Judge0Service } from '../judge0/judge0.service';
import { GitHubService } from '../github/github.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly judge0Service: Judge0Service,
    private readonly gitHubService: GitHubService,
  ) {}

  async getTasksList(
    categorySlug: string,
  ): Promise<{ slug: string; title: string }[]> {
    const taskSlugs = await this.gitHubService.getDirectoryList(
      `${categorySlug}/tasks`,
    );

    const tasks: { slug: string; title: string }[] = [];

    for (const slug of taskSlugs) {
      try {
        const meta = await this.gitHubService.getJsonFileContent(
          `${categorySlug}/tasks/${slug}/meta.json`,
        );
        tasks.push({ slug, title: meta.title ?? slug });
      } catch {
        tasks.push({ slug, title: slug });
      }
    }

    return tasks;
  }

  async getTask(
    categorySlug: string,
    taskSlug: string,
  ): Promise<{
    slug: string;
    title: string;
    description?: string;
    points?: number;
    statement?: string;
    testCases?: { input: string; expectedOutput: string | number }[];
  }> {
    const meta = await this.gitHubService.getJsonFileContent(
      `${categorySlug}/tasks/${taskSlug}/meta.json`,
    );

    let statement = '';
    try {
      statement = await this.gitHubService.getMarkdownFileContent(
        `${categorySlug}/tasks/${taskSlug}/index.md`,
      );
    } catch {
      statement = '';
    }

    return {
      slug: taskSlug,
      title: meta.title ?? taskSlug,
      description: meta.description,
      points: meta.points,
      statement,
      testCases: meta.testCases,
    };
  }

  async submitSolution(
    userId: string,
    categorySlug: string,
    taskSlug: string,
    userSolutionCode: string,
    language: keyof typeof this.judge0Service.languageMap,
    testCases: { input: string; expectedOutput: string | number }[],
    points?: number, // добавляем параметр для очков
  ): Promise<{ success: boolean; message: string; pointsEarned?: number }> {
    if (!testCases.length) {
      throw new BadRequestException('Нет тестов для задачи');
    }

    for (const testCase of testCases) {
      const submissionResult = await this.judge0Service.createSubmission(
        userSolutionCode,
        language,
        testCase.input,
      );

      if (submissionResult.status.description !== 'Accepted') {
        return {
          success: false,
          message: `Ошибка при выполнении: ${submissionResult.status.description}`,
        };
      }

      const output = submissionResult.stdout?.trim() ?? '';
      const expectedOutput = String(testCase.expectedOutput).trim();

      if (output !== expectedOutput) {
        return {
          success: false,
          message: `Тест не пройден. Вход: "${testCase.input}", ожидалось: "${expectedOutput}", получено: "${output}"`,
        };
      }
    }

    return {
      success: true,
      message: 'Все тесты пройдены',
      pointsEarned: points ?? 10,
    };
  }
}
