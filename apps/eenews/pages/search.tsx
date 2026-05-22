import {
  SearchPage,
  SearchPageGetServerSideProps as getServerSideProps,
} from '@wepublish/utils/website';
import { ComponentProps } from 'react';

import { EenewsPageShell } from '../src/components/eenews-page-shell';

export { getServerSideProps };

export default function Search(props: ComponentProps<typeof SearchPage>) {
  return (
    <EenewsPageShell>
      <SearchPage {...props} />
    </EenewsPageShell>
  );
}
