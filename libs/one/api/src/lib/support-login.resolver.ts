import { Query, Resolver } from '@nestjs/graphql';
import { Public } from '@wepublish/authentication/api';
import { isImpersonationEnabled } from '@wepublish/session/api';

@Resolver()
export class SupportLoginResolver {
  @Public()
  @Query(() => Boolean, {
    description:
      'Whether the editor offers the We.Publish support login on its login page.',
  })
  supportLoginEnabled(): boolean {
    return isImpersonationEnabled(process.env);
  }
}
