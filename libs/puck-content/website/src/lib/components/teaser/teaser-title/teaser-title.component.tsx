import { Typography } from '@mui/material';
import { selectTeaserTitle } from '@wepublish/block-content/website';

import { useTeaserSlot } from '../../../contexts/teaser-slot.context';
import { HideWhenEmptyProps } from '../teaser-part';

export type TeaserTitleConfigProps = HideWhenEmptyProps & {
  className?: string;
};

export const TeaserTitle = ({
  className,
  hideWhenEmpty = true,
}: TeaserTitleConfigProps) => {
  const teaser = useTeaserSlot();
  const title = teaser && selectTeaserTitle(teaser);

  if (!title && hideWhenEmpty) {
    return null;
  }

  return (
    <Typography
      className={className}
      variant="teaserTitle"
      component="h2"
      aria-hidden={!title || undefined}
    >
      {title || ' '}
    </Typography>
  );
};
