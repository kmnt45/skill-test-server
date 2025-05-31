import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GitHubService } from '../github/github.service';
import { UsersService } from '../users/users.service';

export type QuestionForClient = {
  question: string;
  code: string | null;
  answers: string[];
  progress: {
    current: number;
    total: number;
  };
};

@Injectable()
export class TestsService {
  constructor(
    private readonly gitHubService: GitHubService,
    private readonly usersService: UsersService,
  ) {}

  private async getFullTest(
    categorySlug: string,
    testSlug: string,
  ): Promise<any> {
    const path = `${categorySlug}/tests/${testSlug}/index.json`;
    try {
      return await this.gitHubService.getJsonFileContent(path);
    } catch (e) {
      throw new NotFoundException('Тест не найден');
    }
  }

  async getTestsList(
    categorySlug: string,
  ): Promise<{ slug: string; title: string; total?: number }[]> {
    const path = `${categorySlug}/tests/tests.json`;
    try {
      return await this.gitHubService.getJsonFileContent(path);
    } catch (e) {
      throw new NotFoundException('Не удалось получить список тестов');
    }
  }

  async getQuestion(
    categorySlug: string,
    testSlug: string,
    index: number,
  ): Promise<QuestionForClient> {
    const test = await this.getFullTest(categorySlug, testSlug);
    if (!test.questions || !test.questions[index]) {
      throw new NotFoundException('Вопрос не найден');
    }

    const { question, code, answers } = test.questions[index];

    return {
      question,
      code,
      answers,
      progress: {
        current: index + 1,
        total: test.questions.length,
      },
    };
  }

  async checkAnswer(
    categorySlug: string,
    testSlug: string,
    index: number,
    answerIndex: number,
  ): Promise<{ correct: boolean }> {
    const test = await this.getFullTest(categorySlug, testSlug);
    if (!test.questions || !test.questions[index]) {
      throw new NotFoundException('Вопрос не найден');
    }
    if (answerIndex < 0) {
      throw new BadRequestException('Неверный индекс ответа');
    }
    const question = test.questions[index];
    return { correct: question.correctAnswerIndex === answerIndex };
  }

  async completeTest(
    userId: string,
    categorySlug: string,
    testSlug: string,
    userAnswers: number[],
  ): Promise<{
    totalQuestions: number;
    correctAnswers: number;
    pointsEarned: number;
  }> {
    const test = await this.getFullTest(categorySlug, testSlug);
    if (!test.questions || !Array.isArray(test.questions)) {
      throw new NotFoundException('Тест не найден или некорректен');
    }

    if (!userAnswers || userAnswers.length !== test.questions.length) {
      throw new BadRequestException('Неверное количество ответов');
    }

    let correctAnswersCount = 0;
    for (let i = 0; i < test.questions.length; i++) {
      const correctIndex = test.questions[i].correctAnswerIndex;
      if (correctIndex === userAnswers[i]) {
        correctAnswersCount++;
      }
    }

    const totalPoints = test.points ?? 0;
    const pointsEarned = Math.floor(
      (correctAnswersCount / test.questions.length) * totalPoints,
    );

    const testsList = await this.getTestsList(categorySlug);
    const testInfo = testsList.find((t) => t.slug === testSlug);
    const title = testInfo?.title || testSlug;

    await this.usersService.updateUserProgress(userId, {
      slug: testSlug,
      title,
      points: pointsEarned,
    });

    return {
      totalQuestions: test.questions.length,
      correctAnswers: correctAnswersCount,
      pointsEarned,
    };
  }
}
