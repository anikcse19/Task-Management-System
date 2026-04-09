import { IsEnum } from "class-validator";
import { TaskStatus } from "../../generated/prisma/client";

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus, {
    message: "Status must be one of: PENDING, PROCESSING, DONE",
  })
  status!: TaskStatus;
}
