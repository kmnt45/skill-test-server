import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { Judge0Service } from './judge0.service';

@Module({
  imports: [HttpModule],
  providers: [Judge0Service],
  exports: [Judge0Service],
})
export class Judge0Module {}
