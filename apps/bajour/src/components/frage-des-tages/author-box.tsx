import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { Author } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { memo } from 'react';
import { MdPerson } from 'react-icons/md';

interface AuthorBoxProps {
  author: Author;
  className?: string;
}

const avatarStyles = css`
  width: 46px;
  height: 46px;
  border-radius: 50%;
`;

export const AuthorWrapper = styled('article')`
  display: grid;
  gap: ${({ theme }) => theme.spacing(2)};
  background-color: ${({ theme }) => theme.palette.common.white};
  padding: ${({ theme }) => theme.spacing(1.5)};
  border-radius: ${({ theme }) => theme.spacing(2.5)};
  color: ${({ theme }) => theme.palette.primary.main};
`;

export const AuthorHeader = styled('header')`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: ${({ theme }) => theme.spacing(2)};
  align-items: center;
`;

export const AuthorHeaderContent = styled('div')``;

export const AuthorName = styled('div')`
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: ${({ theme }) => theme.spacing(1)};
  align-items: center;
  font-weight: ${({ theme }) => theme.typography.fontWeightBold};
  font-size: 17px;

  ${({ theme }) => css`
    ${theme.breakpoints.up('sm')} {
      font-size: 21px;
    }
  `}

  ${({ theme }) => css`
    ${theme.breakpoints.up('xl')} {
      font-size: 24px;
    }
  `}
`;

export const AuthorContent = styled('div')`
  span {
    font-weight: 300;
  }
`;

export const Moderation = styled('span')`
  font-size: 0.75em;
  font-weight: 300;
`;

export const AuthorBox = memo(function AuthorBox({
  author,
  className,
}: AuthorBoxProps) {
  const {
    elements: { Image },
  } = useWebsiteBuilder();

  const image = author?.image;
  const name = author?.name;

  return (
    <AuthorWrapper className={className}>
      <AuthorHeader>
        {image && (
          <Image
            image={image}
            square
            css={avatarStyles}
            maxWidth={200}
          />
        )}
        {!image && <MdPerson css={avatarStyles} />}

        <AuthorHeaderContent>
          <AuthorName>{name}</AuthorName>

          <Moderation>Moderation</Moderation>
        </AuthorHeaderContent>
      </AuthorHeader>
    </AuthorWrapper>
  );
});
