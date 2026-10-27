import { useRouter } from 'next/router';

import { WepGlobalStyles } from './wep-global-styles';

export const WepTenantGlobalStyles = () => {
  const { asPath } = useRouter();

  return <WepGlobalStyles isHomePage={asPath === '/'} />;
};
