import { BuilderArticleProps } from './article.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Article = (props: BuilderArticleProps) => {
  const { Article } = useWebsiteBuilder();

  return <Article {...props} />;
};
