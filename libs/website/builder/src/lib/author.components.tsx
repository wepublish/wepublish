import {
  BuilderAuthorChipProps,
  BuilderAuthorLinksProps,
  BuilderAuthorListItemProps,
  BuilderAuthorListProps,
  BuilderAuthorProps,
} from './author.interface';
import { useWebsiteBuilder } from './website-builder.context';

export const Author = (props: BuilderAuthorProps) => {
  const { Author } = useWebsiteBuilder();

  return <Author {...props} />;
};

export const AuthorLinks = (props: BuilderAuthorLinksProps) => {
  const { AuthorLinks } = useWebsiteBuilder();

  return <AuthorLinks {...props} />;
};

export const AuthorChip = (props: BuilderAuthorChipProps) => {
  const { AuthorChip } = useWebsiteBuilder();

  return <AuthorChip {...props} />;
};

export const AuthorListItem = (props: BuilderAuthorListItemProps) => {
  const { AuthorListItem } = useWebsiteBuilder();

  return <AuthorListItem {...props} />;
};

export const AuthorList = (props: BuilderAuthorListProps) => {
  const { AuthorList } = useWebsiteBuilder();

  return <AuthorList {...props} />;
};
