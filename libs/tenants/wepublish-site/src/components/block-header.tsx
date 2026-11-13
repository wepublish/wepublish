import { CSSObject } from '@emotion/react';
import styled from '@emotion/styled';
import {
  isFilledTeaser,
  selectTeaserPreTitle,
  selectTeaserTarget,
  selectTeaserUrl,
} from '@wepublish/block-content/website';
import { FullTeaserFragment } from '@wepublish/website/api';
import { Button, Link } from '@wepublish/website/builder';

import { designText } from '../theme';
import { tertiaryButton } from './button-styles';

const isButton = (teaser: FullTeaserFragment) =>
  teaser.__typename === 'CustomTeaser' && !teaser.image;

/**
 * Splits the teasers of a block into its entries and the button next to its
 * title: a custom teaser without image (e.g. "Alle anzeigen").
 */
export const splitButtonTeaser = (
  teasers: Array<FullTeaserFragment | null | undefined>
) => {
  const filledTeasers = teasers.filter(isFilledTeaser);

  return {
    entries: filledTeasers.filter(teaser => !isButton(teaser)),
    button: filledTeasers.find(isButton),
  };
};

export const BlockHeaderWrapper = styled('div')`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing(2)};
`;

export const BlockHeaderTitle = styled('h2')`
  ${designText.h3 as CSSObject}
  margin: 0;
`;

export const BlockHeaderButton = styled(Button)`
  ${({ theme }) => tertiaryButton(theme)}
`;

/** The title of a block with a button on the right, its pre-title as label */
export const BlockHeader = ({
  title,
  button,
}: {
  title?: string | null;
  button?: FullTeaserFragment;
}) => {
  const label = button && selectTeaserPreTitle(button);
  const url = button && selectTeaserUrl(button);

  if (!title && !label) {
    return null;
  }

  return (
    <BlockHeaderWrapper>
      {title && <BlockHeaderTitle>{title}</BlockHeaderTitle>}

      {label && url && (
        <BlockHeaderButton
          variant="outlined"
          disableRipple
          LinkComponent={Link}
          href={url}
          target={selectTeaserTarget(button) ?? undefined}
        >
          {label}
        </BlockHeaderButton>
      )}
    </BlockHeaderWrapper>
  );
};
