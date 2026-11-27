import { createLoginCodePage } from '@wepublish/utils/website/next';

const { Page, getServerSideProps } = createLoginCodePage({
  next: '/welcome?src=purl',
});

export { getServerSideProps };
export default Page;
