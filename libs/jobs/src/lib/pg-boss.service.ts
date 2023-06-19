import {Injectable, OnModuleDestroy, OnModuleInit} from '@nestjs/common'
import PgBoss from 'pg-boss'

@Injectable()
export class PgBossService extends PgBoss implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.start()
  }

  async onModuleDestroy() {
    await this.stop()
  }
}
