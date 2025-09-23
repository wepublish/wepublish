import styled from '@emotion/styled';
import { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from 'rsuite';

const InlineAvatarWrapper = styled.div`
  display: flex;
  flex-flow: row;
  gap: 8px;
  align-items: center;
  width: max-content;
`;

const FlexLink = styled(Link)`
  display: flex;
`;

export const InlineAvatar = ({
  children,
  url,
  src,
  title,
  showAvatar = true,
}: PropsWithChildren<{
  url?: string;
  src?: string | null;
  title?: string | null;
  showAvatar?: boolean;
}>) => {
  const avatar = showAvatar && (
    <Avatar
      src={src ?? ''}
      alt={title ?? undefined}
      circle
      size="xs"
    />
  );

  return (
    <InlineAvatarWrapper>
      {url ?
        <FlexLink
          to={url}
          title={title ?? undefined}
        >
          {avatar}
        </FlexLink>
      : avatar}

      {children}
    </InlineAvatarWrapper>
  );
};
