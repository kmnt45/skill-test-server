import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { GitHubModule } from '../github/github.module';
import { UsersModule } from '../users/users.module';
import { Judge0Module } from '../judge0/judge0.module';

@Module({
  controllers: [TasksController],
  providers: [TasksService],
  imports: [GitHubModule, UsersModule, Judge0Module],
})
export class TasksModule {}
