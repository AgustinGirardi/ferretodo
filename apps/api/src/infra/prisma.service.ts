import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@ferretodo/db";

/**
 * Servicio Prisma inyectable. Es el único punto de acceso a la base de datos.
 * Los repositorios de cada módulo lo usan detrás de sus interfaces de dominio.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
