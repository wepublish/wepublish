import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Public } from '@wepublish/authentication/api';
import { JwtService } from '@wepublish/session/api';
import { addPredefinedPermissions } from '@wepublish/permissions/api';
import { decodeJwt } from 'jose';
import { ExternalAppsService } from './external-apps.service';

@Controller('external-apps')
export class ExternalAppsUserinfoController {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaClient,
    private externalAppsService: ExternalAppsService
  ) {}

  @Public()
  @Get('userinfo')
  async getUserinfo(@Headers('authorization') authHeader?: string) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header'
      );
    }

    const token = authHeader.slice(7);

    // Decode without verification to get the audience
    const { aud } = decodeJwt(token);
    const audience = Array.isArray(aud) ? aud[0] : aud;

    if (!audience) {
      throw new UnauthorizedException('Token missing audience claim');
    }

    // Verify the audience is a registered external app (compare by origin)
    const apps = await this.externalAppsService.externalAppsList();
    const externalApp = apps.find(app => new URL(app.url).origin === audience);

    if (!externalApp) {
      throw new UnauthorizedException(
        'Token audience does not match any registered external app'
      );
    }

    // Verify the JWT signature with the correct audience
    const userId = await this.jwtService.verifyJWT(token, audience);

    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }

    // Look up the user and their roles
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roles = await this.prisma.userRole.findMany({
      where: { id: { in: user.roleIDs } },
    });

    const rolesWithPermissions = roles.map(role => {
      const enriched = addPredefinedPermissions(role);
      return {
        id: role.id,
        name: role.name,
        description: role.description,
        permissionIDs: [...new Set(enriched.permissionIDs)],
      };
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      flair: user.flair,
      roles: rolesWithPermissions,
    };
  }
}
