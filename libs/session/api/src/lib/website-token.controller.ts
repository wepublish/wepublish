import { Controller, Inject, Logger, Post } from '@nestjs/common';
import { Public } from '@wepublish/authentication/api';
import { JwtService, WEBSITE_URL_TOKEN } from './jwt.service';

@Controller('website')
export class WebsiteTokenController {
  private readonly logger = new Logger(WebsiteTokenController.name);

  constructor(
    private jwtService: JwtService,
    @Inject(WEBSITE_URL_TOKEN) private websiteURL: string
  ) {}

  @Public()
  @Post('token')
  async token() {
    const token = await this.jwtService.generateScopedJWT({
      scope: 'read:website-settings',
      expiresInMinutes: 5,
    });

    const callbackUrl = `${this.websiteURL}/api/website-token`;

    try {
      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        this.logger.warn(
          `Failed to deliver scoped JWT to website at ${callbackUrl}: ${response.status} ${response.statusText}`
        );

        return { success: false };
      }
    } catch (error) {
      this.logger.warn(
        `Could not reach website at ${callbackUrl}. Is the website running? Error: ${(error as Error).message}`
      );

      return { success: false };
    }

    this.logger.log(
      `Successfully delivered scoped JWT to website at ${callbackUrl}`
    );

    return { success: true };
  }
}
