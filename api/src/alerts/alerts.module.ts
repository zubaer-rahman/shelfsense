import { Module } from "@nestjs/common";
import { AlertsService } from "./alerts.service.js";
import { AlertsListener } from "./listeners/alerts.listener.js";

// Encapsulates inventory alert monitoring, observer listeners, and alerts export.
@Module({
  providers: [AlertsService, AlertsListener],
  exports: [AlertsService],
})
export class AlertsModule {}
