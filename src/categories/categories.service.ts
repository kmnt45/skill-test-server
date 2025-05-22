import { Injectable } from '@nestjs/common';
import { GitHubService } from '../github/github.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly gitHubService: GitHubService) {}

  async getCategories(): Promise<string[]> {
    try {
      return await this.gitHubService.getDirectoryList('');
    } catch (err) {
      throw new Error('Не удалось получить список категорий');
    }
  }
}
