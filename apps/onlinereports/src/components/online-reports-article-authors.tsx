import styled from '@emotion/styled';
import { Button, IconButton } from '@mui/material';
import { ArticleDateWrapper } from '@wepublish/article/website';
import { CommentListItemShareWrapper } from '@wepublish/comments/website';
import { useCommentListQuery } from '@wepublish/website/api';
import {
  BuilderArticleAuthorsProps,
  useWebsiteBuilder,
} from '@wepublish/website/builder';
import { useEffect, useState } from 'react';
import { MdOutlineModeComment } from 'react-icons/md';

import {
  AuthorChipImageWrapper,
  AuthorChipName,
  avatarImageStyles,
} from './author-chip';

export const ArticleAuthorsWrapper = styled('div')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(1.5)};
  grid-template-areas:
    'images names'
    'images date';
  grid-template-columns: min-content auto;
  row-gap: 0;
  flex-grow: 1;

  ${ArticleDateWrapper} {
    font-size: 14px;
    line-height: 1em;
  }
`;

const AuthorAvatars = styled('div')`
  grid-area: images;
  display: flex;
  column-gap: ${({ theme }) => theme.spacing(1.5)};
`;

const AuthorNames = styled('div')`
  grid-area: names;
  display: flex;
  flex-wrap: wrap;
  align-self: end;
  row-gap: 0;
  font-size: 16px;

  ${AuthorChipName} {
    line-height: 1.25rem;
    &:has(+ ${AuthorChipName}) {
      padding-right: ${({ theme }) => theme.spacing(0.5)};
    }

    a {
      color: ${({ theme }) => theme.palette.text.primary};
      text-decoration: none;
      font-weight: 500;
      white-space: break-spaces;
    }
  }
`;

const MetaWrapper = styled('div')`
  display: flex;
  justify-items: stretch;
  @media screen and (max-width: 430px) {
    flex-wrap: wrap;
  }
`;

const CommentsShareBox = styled('div')`
  display: flex;
  gap: ${({ theme }) => theme.spacing(0)};

  button {
    color: ${({ theme }) => theme.palette.primary.main};
  }
`;

const ShareButton = styled(Button)`
  font-weight: 300;
`;

export function OnlineReportsArticleAuthors({
  article,
}: BuilderArticleAuthorsProps) {
  const {
    CommentListItemShare,
    ArticleDate,
    elements: { Image, Link },
  } = useWebsiteBuilder();

  const [url, setUrl] = useState(article.url);

  const { data } = useCommentListQuery({
    fetchPolicy: 'cache-only',
    variables: {
      itemId: article.id,
    },
  });

  useEffect(() => {
    if (url.startsWith('/')) {
      setUrl(window.location.origin + article.url);
    }
  }, [article.url, url]);

  const authors =
    article?.latest.authors.filter(author => !author.hideOnArticle) || [];
  if (!authors.length) {
    return;
  }

  const scrollToComments = () => {
    const el = document.getElementById('comments');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <MetaWrapper>
      <ArticleAuthorsWrapper>
        <AuthorAvatars>
          {authors?.map(
            author =>
              author.image && (
                <AuthorChipImageWrapper key={author.id}>
                  <Image
                    key={author.id}
                    image={author.image}
                    square
                    css={avatarImageStyles}
                    maxWidth={200}
                  />
                </AuthorChipImageWrapper>
              )
          )}
        </AuthorAvatars>

        <AuthorNames>
          {authors?.map((author, i) => (
            <AuthorChipName key={author.id}>
              <Link href={author.url}>{author.name}</Link>
              {i < authors.length - 1 && ', '}
            </AuthorChipName>
          ))}
        </AuthorNames>

        <div style={{ gridArea: 'date' }}>
          <ArticleDate article={article} />
        </div>
      </ArticleAuthorsWrapper>

      <CommentsShareBox>
        {!article?.disableComments && (
          <CommentListItemShareWrapper>
            {data?.commentsForItem?.length ?
              <ShareButton
                onClick={scrollToComments}
                endIcon={<MdOutlineModeComment />}
                size={'small'}
              >
                {data?.commentsForItem?.length ?
                  data.commentsForItem.length
                : ''}
              </ShareButton>
            : <IconButton
                onClick={scrollToComments}
                size={'small'}
                sx={{ marginRight: '8px' }}
              >
                <MdOutlineModeComment />
              </IconButton>
            }
          </CommentListItemShareWrapper>
        )}

        <CommentListItemShare
          title={article.latest.title ?? ''}
          url={url}
          forceNonSystemShare={true}
        />
      </CommentsShareBox>
    </MetaWrapper>
  );
}
