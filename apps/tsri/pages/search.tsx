import { SearchPage } from '@wepublish/utils/website';

const TsriSearchPage = styled(SearchPage)`
  padding-top: calc(var(--navbar-height) / 2);

  & > h1.MuiTypography-root {
    display: none;
  }
`;

export { SearchPageGetServerSideProps as getServerSideProps };
export { TsriSearchPage as default };
