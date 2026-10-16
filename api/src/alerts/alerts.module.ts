import { Module } from "@nestjs/common";
import { AlertsService } from "./alerts.service.js";
import { AlertsController } from "./alerts.controller.js";
import { AlertsListener } from "./listeners/alerts.listener.js";

// Encapsulates inventory alert monitoring, observer listeners, and alerts export.
@Module({
  controllers: [AlertsController],
  providers: [AlertsService, AlertsListener],
  exports: [AlertsService],
})
export class AlertsModule {}
