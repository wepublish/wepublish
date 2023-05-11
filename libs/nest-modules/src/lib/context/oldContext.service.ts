/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import {Injectable, OnModuleInit} from '@nestjs/common'

// nx-ignore-next-line
import type {Context} from '../../../../api/src/lib/context'

@Injectable()
export class OldContextService implements OnModuleInit {
  public context: Context = global.oldContext

  async onModuleInit() {
    this.context = global.oldContext
  }
}
