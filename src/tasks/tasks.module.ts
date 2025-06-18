import { Module } from "@nestjs/common";
import { TasksController } from "./tasks.controller";
import { TasksService } from "./tasks.service";
import { GitHubModule } from "@/github/github.module";
import { UsersModule } from "@/users/users.module";
import { Vm2Module } from "@/vm2/vm2.module";

@Module({
  controllers: [TasksController],
  providers: [TasksService],
  imports: [GitHubModule, UsersModule, Vm2Module],
})
export class TasksModule {}
