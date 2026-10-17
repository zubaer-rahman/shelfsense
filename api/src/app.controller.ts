import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AppService } from "./app.service.js";

@ApiTags("Health")
@Controller("health")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: "Service health probe and availability check" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  @Get()
  getHealth() {
    return this.appService.getHealth();
  }
}
