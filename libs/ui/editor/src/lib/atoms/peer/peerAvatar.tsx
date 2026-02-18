import { FullPeerFragment } from '@wepublish/editor/api';
import { PropsWithChildren } from 'react';

import { InlineAvatar } from '../inlineAvatar';

export const PeerAvatar = ({
  peer,
  children,
}: PropsWithChildren<{
  peer?: FullPeerFragment | null;
}>) => {
  const logo = peer?.profile?.squareLogo ?? peer?.profile?.logo;

  return (
    <InlineAvatar
      children={children}
      url={peer ? `/peering/edit/${peer?.id}` : undefined}
      src={logo?.xxsSquare}
      title={peer?.name}
      showAvatar={!!peer}
    />
  );
};
