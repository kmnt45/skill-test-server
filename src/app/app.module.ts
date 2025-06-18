import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";

import { UsersModule } from "@/users/users.module";
import { AuthModule } from "@/auth/auth.module";
import { GitHubModule } from "@/github/github.module";
import { CategoriesModule } from "@/categories/categories.module";
import { QuestionsModule } from "@/questions/questions.module";
import { TestsModule } from "@/tests/tests.module";
import { TasksModule } from "@/tasks/tasks.module";
import { Vm2Module } from "@/vm2/vm2.module";

import { configuration } from "@/configuration";
import { IConfig } from "@/configuration/types";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<IConfig>("app").mongoUri,
      }),
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const appConfig = configService.get<IConfig>("app");

        return {
          transport: {
            host: appConfig.mailerHost,
            port: Number(appConfig.mailerPort),
            secure: true,
            auth: {
              user: appConfig.mailerUser,
              pass: appConfig.mailerPassword,
            },
          },
          defaults: {
            from: `"No Reply" <${appConfig.mailerUser}>`,
          },
          template: {
            dir: __dirname + "/templates/emails",
            adapter: new HandlebarsAdapter(),
            options: { strict: true },
          },
        };
      },
    }),

    AuthModule,
    UsersModule,
    CategoriesModule,
    GitHubModule,
    QuestionsModule,
    TestsModule,
    TasksModule,
    Vm2Module,
  ],
})
export class AppModule {}
