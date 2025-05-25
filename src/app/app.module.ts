import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { GitHubModule } from '../github/github.module';
import { CategoriesModule } from '../categories/categories.module';
import { QuestionsModule } from '../questions/questions.module';
import { TestsModule } from '../tests/tests.module';
import { TasksModule } from '../tasks/tasks.module';
import { Judge0Module } from '../judge0/judge0.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST'),
          port: configService.get<number>('SMTP_PORT'),
          secure: configService.get<boolean>('SMTP_SECURE'),
          auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: `"No Reply" <${configService.get<string>('SMTP_FROM')}>`,
        },
        template: {
          dir: __dirname + '/templates/emails',
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    UsersModule,
    CategoriesModule,
    GitHubModule,
    QuestionsModule,
    TestsModule,
    TasksModule,
    Judge0Module,
  ],
})
export class AppModule {}
