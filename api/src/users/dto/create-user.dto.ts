import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { Transform } from "class-transformer";
import { Role } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ example: "Staff Member", description: "Full name of the user" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "staff2@shelfsense.local", description: "Email address" })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;

  @ApiProperty({ example: "password123", minLength: 6, description: "Account password" })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ enum: Role, default: Role.STAFF, description: "Role assigned to the user" })
  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.STAFF;
}
