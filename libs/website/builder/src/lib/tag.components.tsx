import { BuilderTagProps, BuilderTagSEOProps } from './tag.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Tag = (props: BuilderTagProps) => {
  const { Tag } = useWebsiteBuilder();

  return <Tag {...props} />;
};

export const TagSEO = (props: BuilderTagSEOProps) => {
  const { TagSEO } = useWebsiteBuilder();

  return <TagSEO {...props} />;
};
