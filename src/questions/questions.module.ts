import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { GitHubModule } from '../github/github.module';

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService],
  imports: [GitHubModule],
})
export class QuestionsModule {}
