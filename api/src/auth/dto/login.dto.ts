import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({
    example: "owner@shelfsense.local",
    description: "Registered user email address",
  })
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email!: string;

  @ApiProperty({
    example: "password123",
    description: "Account password",
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
