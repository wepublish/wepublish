import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ApiToken } from '@wepublish/api-token/api';
import { CurrentUser, UserSession } from '@wepublish/authentication/api';

import { ExternalApp } from './external-apps.model';
import { ExternalAppsService } from './external-apps.service';
import { apiTokenReader } from './external-apps.resolver';

@Resolver(() => ExternalApp)
export class ExternalAppApiTokenResolver {
  constructor(private externalAppsService: ExternalAppsService) {}

  @ResolveField(() => ApiToken, {
    nullable: true,
    description: `The linked API key, for editors who may see it in the API keys list. Never contains the secret.`,
  })
  apiToken(
    @Parent() app: ExternalApp,
    @CurrentUser() session: UserSession | undefined
  ) {
    return this.externalAppsService.linkedApiToken(
      { apiTokenId: app.apiTokenId ?? null },
      apiTokenReader(session)
    );
  }
}
