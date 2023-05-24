import {Module} from '@nestjs/common'
import {SettingsGuard} from './settings.guard'
import {PrismaModule} from '@wepublish/nest-modules'

@Module({
  imports: [PrismaModule],
  providers: [SettingsGuard],
  exports: [SettingsGuard]
})
export class SettingModule {}
