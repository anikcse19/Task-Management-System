import { IsNotEmpty, IsString, IsOptional, IsUUID } from "class-validator";

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsNotEmpty()
  @IsString()
  description!: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}
