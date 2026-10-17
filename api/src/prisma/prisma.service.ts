import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Manages the shared database connection pool and Prisma client lifecycle as an application-wide singleton.
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: pg.Pool;

  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>("DATABASE_URL");
    const pool = new pg.Pool({
      connectionString,
      max: process.env.NODE_ENV === "production" ? 20 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    const adapter = new PrismaPg(pool);

    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("Successfully connected to database via Prisma");
    } catch (error: any) {
      this.logger.error(`Database connection failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log("Prisma client disconnected and pool ended");
  }
}
