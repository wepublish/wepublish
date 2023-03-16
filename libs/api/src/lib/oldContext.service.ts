import {Injectable, OnModuleInit} from '@nestjs/common'
import {Context} from './context'

@Injectable()
export class OldContextService implements OnModuleInit {
  public context: Context = global.oldContext
  async onModuleInit() {
    this.context = global.oldContext
  }
}
