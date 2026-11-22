import {
  addClientCacheToProps,
  getApiClient,
  MeDocument,
  SessionInfoDocument,
} from '@wepublish/website/api';
import { NextPage, NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { getApiUrl } from '../../../lib/api-url';
import { ssrAuthLink } from '../../../lib/auth-link';
import { Welcome } from '../../../lib/components/welcome/welcome';
import { withAuthGuard } from '../../auth-guard';
import { getSessionTokenProps } from '../../get-session-token-props';

export type WelcomePageProps = {
  className?: string;
  profilePath?: string;
};

function WelcomePageComponent({
  className,
  profilePath = '/profile',
}: WelcomePageProps) {
  const router = useRouter();

  return (
    <Welcome
      className={className}
      emailConfirmed={!!router.query.emailConfirmed}
      onDone={() => router.replace(profilePath)}
    />
  );
}

const GuardedWelcome = withAuthGuard(
  WelcomePageComponent
) as NextPage<WelcomePageProps>;

GuardedWelcome.getInitialProps = async (ctx: NextPageContext) => {
  if (typeof window !== 'undefined') {
    return {};
  }

  const sessionProps = await getSessionTokenProps(ctx);
  const client = getApiClient(getApiUrl(), [
    ssrAuthLink(sessionProps.sessionToken?.token),
  ]);

  if (sessionProps.sessionToken) {
    await Promise.all([
      client.query({ query: MeDocument }),
      client.query({ query: SessionInfoDocument }),
    ]);
  }

  return addClientCacheToProps(client, sessionProps);
};

export { GuardedWelcome as WelcomePage };
