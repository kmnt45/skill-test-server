import { Module } from '@nestjs/common';
import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';
import { GitHubModule } from '../github/github.module';
import { UsersModule } from '../users/users.module';

@Module({
  controllers: [TestsController],
  providers: [TestsService],
  imports: [GitHubModule, UsersModule],
})
export class TestsModule {}
