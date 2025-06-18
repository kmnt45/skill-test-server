import { Module } from "@nestjs/common";
import { Vm2Service } from "./vm2.service";

@Module({
  providers: [Vm2Service],
  exports: [Vm2Service],
})
export class Vm2Module {}
