import {
  BuilderArticleAuthorsProps,
  BuilderArticleDateProps,
  BuilderArticleListProps,
  BuilderArticleMetaProps,
  BuilderArticleProps,
  BuilderArticleSEOProps,
} from './article.interface';
import { BuilderAuthorChipProps } from './author.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Article = (props: BuilderArticleProps) => {
  const { Article } = useWebsiteBuilder();

  return <Article {...props} />;
};

export const ArticleSEO = (props: BuilderArticleSEOProps) => {
  const { ArticleSEO } = useWebsiteBuilder();

  return <ArticleSEO {...props} />;
};

export const ArticleMeta = (props: BuilderArticleMetaProps) => {
  const { ArticleMeta } = useWebsiteBuilder();

  return <ArticleMeta {...props} />;
};

export const ArticleDate = (props: BuilderArticleDateProps) => {
  const { ArticleDate } = useWebsiteBuilder();

  return <ArticleDate {...props} />;
};

export const ArticleAuthor = (props: BuilderAuthorChipProps) => {
  const { ArticleAuthor } = useWebsiteBuilder();

  return <ArticleAuthor {...props} />;
};

export const ArticleAuthors = (props: BuilderArticleAuthorsProps) => {
  const { ArticleAuthors } = useWebsiteBuilder();

  return <ArticleAuthors {...props} />;
};

export const ArticleList = (props: BuilderArticleListProps) => {
  const { ArticleList } = useWebsiteBuilder();

  return <ArticleList {...props} />;
};
