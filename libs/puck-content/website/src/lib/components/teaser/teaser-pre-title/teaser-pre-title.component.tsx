import { Typography } from '@mui/material';
import { selectTeaserPreTitle } from '@wepublish/block-content/website';

import { useTeaserSlot } from '../../../contexts/teaser-slot.context';
import { HideWhenEmptyProps } from '../teaser-part';

export type TeaserPreTitleConfigProps = HideWhenEmptyProps & {
  className?: string;
};

export const TeaserPreTitle = ({
  className,
  hideWhenEmpty = true,
}: TeaserPreTitleConfigProps) => {
  const teaser = useTeaserSlot();
  const preTitle = teaser && selectTeaserPreTitle(teaser);

  if (!preTitle && hideWhenEmpty) {
    return null;
  }

  return (
    <Typography
      className={className}
      variant="teaserPretitle"
      component="div"
      aria-hidden={!preTitle || undefined}
    >
      {preTitle || ' '}
    </Typography>
  );
};
