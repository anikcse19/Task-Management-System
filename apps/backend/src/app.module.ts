import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { TasksModule } from "./tasks/tasks.module";
import { UsersModule } from "./users/users.module";
import { AuditModule } from "./audit/audit.module";

@Module({
  imports: [
    // Load .env variables globally
    ConfigModule.forRoot({ isGlobal: true }),
    // Database connection (Prisma)
    PrismaModule,
    // Feature modules
    AuthModule,
    TasksModule,
    UsersModule,
    AuditModule,
  ],
})
export class AppModule {}
