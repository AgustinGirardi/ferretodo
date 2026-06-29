import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { validateEnv } from "./config/env";
import { PrismaModule } from "./infra/prisma.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    HealthModule,
    // Próximos módulos (ver docs/03-BACKEND.md):
    // AuthModule, UsersModule, CatalogModule, InventoryModule, PricingModule,
    // CartModule, OrdersModule, PaymentsModule, QuotesModule, ...
  ],
})
export class AppModule {}
