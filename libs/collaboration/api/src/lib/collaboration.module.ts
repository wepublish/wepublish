import { Module } from '@nestjs/common';
import { CollaborationGateway } from './collaboration.gateway';
import { PrismaModule } from '@wepublish/nest-modules';

@Module({
  imports: [PrismaModule],
  providers: [CollaborationGateway],
  exports: [CollaborationGateway],
})
export class CollaborationModule {}
