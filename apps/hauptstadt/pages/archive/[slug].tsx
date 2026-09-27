export {
  archiveArticleGetStaticProps as getStaticProps,
  default,
} from '../a/[slug]';

export const getStaticPaths = () => ({
  paths: [],
  fallback: 'blocking',
});
