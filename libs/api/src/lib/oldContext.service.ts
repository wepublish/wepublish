import {Injectable, OnModuleInit} from '@nestjs/common'
import {Context} from './context'

@Injectable()
export class OldContextService implements OnModuleInit {
  public context: Context
  async onModuleInit() {
    this.context = global.oldContext
  }
}
