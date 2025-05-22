import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { GitHubService } from '../github/github.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, GitHubService],
})
export class CategoriesModule {}
