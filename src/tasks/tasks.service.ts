import { Injectable, BadRequestException } from '@nestjs/common';
import { GitHubService } from '../github/github.service';
import { Vm2Service } from '../vm2/vm2.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly vm2Service: Vm2Service,
    private readonly gitHubService: GitHubService,
    private readonly usersService: UsersService,
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
    language: keyof typeof this.vm2Service.languageMap,
    testCases: { input: string; expectedOutput: string | number }[],
    points?: number,
  ): Promise<{ success: boolean; message: string; pointsEarned?: number }> {
    if (!testCases.length) {
      throw new BadRequestException('Нет тестов для задачи');
    }

    for (const testCase of testCases) {
      const result = await this.vm2Service.runCode(
        userSolutionCode,
        language,
        testCase.input,
      );

      if (result.error) {
        return {
          success: false,
          message: `Ошибка при выполнении: ${result.error}`,
        };
      }

      const output = result.stdout?.trim() ?? '';
      const expectedOutput = String(testCase.expectedOutput).trim();

      if (output !== expectedOutput) {
        return {
          success: false,
          message: `Тест не пройден. Вход: "${testCase.input}", ожидалось: "${expectedOutput}", получено: "${output}"`,
        };
      }
    }

    const pointsEarned = points ?? 10;

    const taskMeta = await this.getTask(categorySlug, taskSlug);

    await this.usersService.updateUserProgress(userId, {
      slug: taskSlug,
      title: taskMeta.title ?? taskSlug,
      points: pointsEarned,
    });

    return {
      success: true,
      message: 'Все тесты пройдены',
      pointsEarned,
    };
  }
}
