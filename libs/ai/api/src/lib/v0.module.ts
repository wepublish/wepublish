import { Module } from '@nestjs/common';
import { V0Resolver } from './v0.resolver';

@Module({
  imports: [],
  providers: [V0Resolver],
})
export class V0Module {}
