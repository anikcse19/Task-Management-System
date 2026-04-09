import { Module } from "@nestjs/common";
import { TasksService } from "./tasks.service";
import { TasksController } from "./tasks.controller";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [AuditModule], // Need AuditService for logging task actions
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
