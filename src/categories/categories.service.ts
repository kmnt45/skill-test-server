import { Injectable } from "@nestjs/common";
import { GitHubService } from "@/github/github.service";

export type Category = {
  title: string;
  path: string;
  image: string;
};

@Injectable()
export class CategoriesService {
  constructor(private readonly gitHubService: GitHubService) {}

  async getCategories(): Promise<Category[]> {
    try {
      return await this.gitHubService.getJsonFileContent("categories.json");
    } catch (err) {
      throw new Error("Не удалось получить список категорий");
    }
  }
}
