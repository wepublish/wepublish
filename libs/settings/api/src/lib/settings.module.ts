import {Module} from '@nestjs/common'
import {SettingsGuard} from './settings.guard'
import {PrismaModule} from '@wepublish/nest-modules'

import {SettingsResolver} from './settings.resolver'
import {SettingsService} from './settings.service'
import {GraphQLSettingValueType} from './settings.model'

@Module({
  imports: [PrismaModule],
  providers: [SettingsGuard, SettingsResolver, SettingsService, GraphQLSettingValueType],
  exports: [SettingsGuard]
})
export class SettingModule {}
