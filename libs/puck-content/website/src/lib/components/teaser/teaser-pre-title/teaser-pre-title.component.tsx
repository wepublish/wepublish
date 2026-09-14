import { Typography } from '@mui/material';
import { selectTeaserPreTitle } from '@wepublish/block-content/website';

import { useTeaserSlot } from '../../../contexts/teaser-slot.context';

export type TeaserPreTitleConfigProps = {
  className?: string;
};

export const TeaserPreTitle = ({ className }: TeaserPreTitleConfigProps) => {
  const teaser = useTeaserSlot();
  const preTitle = teaser && selectTeaserPreTitle(teaser);

  if (!preTitle) {
    return null;
  }

  return (
    <Typography
      className={className}
      variant="teaserPretitle"
      component="div"
    >
      {preTitle}
    </Typography>
  );
};
