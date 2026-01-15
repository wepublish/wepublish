import styled from '@emotion/styled';
import {
  SearchPage,
  SearchPageGetServerSideProps,
} from '@wepublish/utils/website';

export default styled(SearchPage)`
  & > h1.MuiTypography-root {
    display: none;
  }
`;
export { SearchPageGetServerSideProps as getServerSideProps };
