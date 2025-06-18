import { Injectable } from "@nestjs/common";
import { GitHubService } from "@/github/github.service";

export type Question = {
  slug: string;
  title: string;
};

@Injectable()
export class QuestionsService {
  constructor(private readonly gitHubService: GitHubService) {}

  async getQuestionsList(categorySlug: string): Promise<Question[]> {
    const path = `${categorySlug}/questions/questions.json`;
    return await this.gitHubService.getJsonFileContent(path);
  }

  async getQuestionMarkdown(
    categorySlug: string,
    questionSlug: string,
  ): Promise<string> {
    const path = `${categorySlug}/questions/${questionSlug}/index.md`;
    return await this.gitHubService.getMarkdownFileContent(path);
  }
}
