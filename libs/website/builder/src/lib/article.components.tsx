import {
  BuilderArticleProps,
  BuilderArticleSEOProps,
} from './article.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Article = (props: BuilderArticleProps) => {
  const { Article } = useWebsiteBuilder();

  return <Article {...props} />;
};

export const ArticleSEO = (props: BuilderArticleSEOProps) => {
  const { ArticleSEO } = useWebsiteBuilder();

  return <ArticleSEO {...props} />;
};
