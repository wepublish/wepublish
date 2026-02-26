import { Module } from '@nestjs/common';
import { PermissionsGuard } from './permission.guard';
import { PermissionResolver } from './permission.resolver';

@Module({
  providers: [PermissionsGuard, PermissionResolver],
  exports: [PermissionsGuard],
})
export class PermissionModule {}
