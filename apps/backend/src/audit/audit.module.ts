import { Module } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { AuditController } from "./audit.controller";

@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService], // Exported so TasksModule can inject it
})
export class AuditModule {}
