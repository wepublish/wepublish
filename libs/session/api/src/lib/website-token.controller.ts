import { Controller, Logger, Post } from '@nestjs/common';
import { Public } from '@wepublish/authentication/api';
import { JwtService } from './jwt.service';

@Controller('website')
export class WebsiteTokenController {
  private readonly logger = new Logger(WebsiteTokenController.name);

  constructor(private jwtService: JwtService) {}

  @Public()
  @Post('token')
  async token() {
    const token = await this.jwtService.generateScopedJWT({
      scope: 'read:website-settings',
      expiresInMinutes: 5,
    });

    return token;
  }
}
