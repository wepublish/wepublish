import { Module } from '@nestjs/common';
import { ImageModule } from '@wepublish/image/api';
import { PrismaModule } from '@wepublish/nest-modules';
import { UserDataloaderService } from './user-dataloader.service';
import {
  HasOptionalUserLcResolver,
  HasOptionalUserResolver,
  HasUserLcResolver,
  HasUserResolver,
} from './has-user/has-user.resolver';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';
import { ProfileService } from './profile.service';
import { ProfileResolver } from './profile.resolver';
import { PropertyModule } from '@wepublish/property/api';
import { UserRoleResolver } from './user-role.resolver';
import { UserRoleService } from './user-role.service';
import { UserRoleDataloader } from './user-role.dataloader';

@Module({
  imports: [PrismaModule, ImageModule, PropertyModule],
  providers: [
    UserDataloaderService,
    HasUserResolver,
    HasUserLcResolver,
    HasOptionalUserResolver,
    HasOptionalUserLcResolver,
    UserService,
    UserResolver,
    ProfileResolver,
    ProfileService,
    UserRoleResolver,
    UserRoleService,
    UserRoleDataloader,
  ],
  exports: [UserDataloaderService, UserRoleDataloader, UserService],
})
export class UserModule {}
