import {
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Public } from '@wepublish/authentication/api';
import { ConfiguratorService } from './configurator.service';

type ReceiveSecretsBody = { token?: string };

@Controller('_configurator')
export class ConfiguratorController {
  constructor(private readonly service: ConfiguratorService) {}

  @Public()
  @Post('secrets')
  @HttpCode(200)
  async receive(@Body() body: ReceiveSecretsBody): Promise<void> {
    if (!body?.token) {
      throw new UnauthorizedException('Missing token');
    }
    await this.service.receiveSecrets(body.token);
  }
}
